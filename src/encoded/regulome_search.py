from pyramid.httpexceptions import HTTPSeeOther
from pyramid.httpexceptions import HTTPTemporaryRedirect
from pyramid.view import view_config
from snovault import TYPES
from snovault.elasticsearch.interfaces import (
    ELASTIC_SEARCH,
    SNP_SEARCH_ES
)
from snovault.elasticsearch.indexer import MAX_CLAUSES_FOR_ES
from pyramid.security import effective_principals
from snovault.viewconfigs.base_view import BaseView
from encoded.helpers.helper import (
    format_results,
    search_result_actions
)
from snovault.helpers.helper import (
    get_filtered_query,
    set_filters,
    set_facets,
    list_result_fields,
)
from .batch_download import get_peak_metadata_links
from .regulome_atlas import RegulomeAtlas
from .vis_defines import (
    vis_format_url
)
import pyBigWig
from collections import OrderedDict
import requests
from urllib.parse import urlencode

import logging
import re
import time

log = logging.getLogger(__name__)


_ENSEMBL_URL = 'http://rest.ensembl.org/'
_ENSEMBL_URL_GRCH37 = 'http://grch37.rest.ensembl.org/'

_REGULOME_FACETS = [
    ('assay_term_name', {'title': 'Assay'}),
    ('annotation_type', {'title': 'Annotation type'}),
    ('status', {'title': 'Status'}),
    ('biosample_term_name', {'title': 'Biosample term', 'type': 'typeahead'}),
    ('target.label', {'title': 'Target', 'type': 'typeahead', 'length': 'long'}),
    ('replicates.library.biosample.donor.organism.scientific_name', {
        'title': 'Organism'
    }),
    ('organ_slims', {'title': 'Organ', 'type': 'typeahead'}),
    ('assembly', {'title': 'Genome assembly'}),
    ('files.file_type', {'title': 'Available data'})
]

_GENOME_TO_SPECIES = {
    'GRCh37': 'homo_sapiens',
    'GRCh38': 'homo_sapiens',
}

_GENOME_TO_ALIAS = {
    'GRCh37': 'hg19',
    'GRCh38': 'GRCh38',
}


def includeme(config):
    config.add_route('regulome-home', '/')
    config.add_route('regulome-summary', '/regulome-summary{slash:/?}')
    config.add_route('regulome-score', '/regulome-score{slash:/?}')
    config.add_route('regulome-search', '/regulome-search{slash:/?}')
    config.add_route('suggest', '/suggest{slash:/?}')
    config.add_route('jbrest', '/jbrest/snp141/{assembly}/{cmd}/{chrom}{slash:/?}')
    config.scan(__name__)


@view_config(route_name='regulome-home', request_method='GET')
def regulome_home(context, request):
    raise HTTPTemporaryRedirect(location='/regulome-search/')


def region_get_hits(atlas, assembly, chrom, start, end, peaks_too=False):
    '''Returns a list of file uuids AND dataset paths for chromosome location'''

    all_hits = {}  # { 'dataset_paths': [], 'files': {}, 'datasets': {}, 'peaks': [], 'message': ''}

    (peaks, peak_details) = atlas.find_peaks_filtered(_GENOME_TO_ALIAS[assembly], chrom, start, end,
                                                      peaks_too)
    if not peaks:
        return {'message': 'No hits found in this location'}
    if peak_details is None:
        return {'message': 'Error during peak filtering'}
    if not peak_details:
        return {'message': 'No %s sources found' % atlas.type()}

    all_hits['peak_count'] = len(peaks)
    if peaks_too:
        all_hits['peaks'] = peaks  # For "download_elements", contains 'inner_hits' with positions
    # NOTE: peak['inner_hits']['positions']['hits']['hits'] may exist with uuids but to same file

    (all_hits['datasets'], all_hits['files']) = atlas.details_breakdown(peak_details)
    all_hits['dataset_paths'] = list(all_hits['datasets'].keys())
    all_hits['file_count'] = len(all_hits['files'])
    all_hits['dataset_count'] = len(all_hits['datasets'])

    all_hits['message'] = ('%d peaks in %d files belonging to %s datasets in this region' %
                           (all_hits['peak_count'], all_hits['file_count'],
                            all_hits['dataset_count']))

    return all_hits


def sanitize_coordinates(term):
    ''' Sanitize the input string and return coordinates '''

    if term.count(':') != 1 or term.count('-') > 1:
        return ('', '', '')
    terms = term.split(':')
    chromosome = terms[0]
    positions = terms[1].split('-')
    if len(positions) == 1:
        start = end = positions[0].replace(',', '')
    elif len(positions) == 2:
        start = positions[0].replace(',', '')
        end = positions[1].replace(',', '')
    if start.isdigit() and end.isdigit():
        return (chromosome, start, end)
    return ('', '', '')


def sanitize_rsid(rsid):
    return 'rs' + ''.join([a for a in filter(str.isdigit, rsid)])


def get_annotation_coordinates(es, aid, assembly):
    ''' Gets annotation coordinates from annotation index in ES '''
    chromosome, start, end = '', '', ''
    try:
        es_results = es.get(index='annotations', doc_type='default', id=aid)
    except Exception:
        return (chromosome, start, end)
    else:
        annotations = es_results['_source']['annotations']
        for annotation in annotations:
            if annotation['assembly_name'] == assembly:
                return ('chr' + annotation['chromosome'],
                        annotation['start'],
                        annotation['end'])
        else:
            return (chromosome, start, end)


def assembly_mapper(location, species, input_assembly, output_assembly):
    # maps location on GRCh38 to hg19 for example
    new_url = (_ENSEMBL_URL + 'map/' + species + '/'
               + input_assembly + '/' + location + '/' + output_assembly
               + '/?content-type=application/json')
    try:
        new_response = requests.get(new_url).json()
    except Exception:
        return('', '', '')
    else:
        if 'mappings' not in new_response or len(new_response['mappings']) < 1:
            return('', '', '')
        data = new_response['mappings'][0]['mapped']
        chromosome = 'chr' + data['seq_region_name']
        start = data['start']
        end = data['end']
        return(chromosome, start, end)


def get_rsid_coordinates(rsid, assembly, atlas=None, webfetch=True):
    if atlas and assembly in ['GRCh38', 'hg19', 'GRCh37']:
        snp = atlas.snp(_GENOME_TO_ALIAS[assembly], rsid)
        if snp:
            try:
                return(snp['chrom'], snp['coordinates']['gte'], snp['coordinates']['lt'])
            except KeyError as e:
                log.warning("Could not find %s on %s, using ensemble" % (rsid, assembly))
                if not webfetch:
                    log.error("Do not lookup: %s", e)
                    raise

    species = _GENOME_TO_SPECIES.get(assembly, 'homo_sapiens')
    ensembl_url = _ENSEMBL_URL
    if assembly == 'GRCh37':
        ensembl_url = _ENSEMBL_URL_GRCH37
    url = '{ensembl}variation/{species}/{id}?content-type=application/json'.format(
        ensembl=ensembl_url,
        species=species,
        id=rsid
    )
    try:
        response = requests.get(url).json()
    except Exception:
        return('', '', '')
    else:
        if 'mappings' not in response:
            return('', '', '')
        for mapping in response['mappings']:
            if 'PATCH' not in mapping['location']:
                if mapping['assembly_name'] == assembly:
                    chromosome, start, end = re.split(':|-', mapping['location'])
                    # must convert to 0-base
                    return('chr' + chromosome, int(start)-1, int(end))
                elif assembly == 'GRCh37':
                    return assembly_mapper(mapping['location'], species, 'GRCh38', assembly)
                elif assembly == 'GRCm37':
                    return assembly_mapper(mapping['location'], species, 'GRCm38', 'NCBIM37')
        return ('', '', '',)


def get_ensemblid_coordinates(eid, assembly):
    species = _GENOME_TO_SPECIES.get(assembly, 'homo_sapiens')
    url = '{ensembl}lookup/id/{id}?content-type=application/json'.format(
        ensembl=_ENSEMBL_URL,
        id=eid
    )
    try:
        response = requests.get(url).json()
    except Exception:
        return('', '', '')
    else:
        location = '{chr}:{start}-{end}'.format(
            chr=response['seq_region_name'],
            start=response['start'],
            end=response['end']
        )
        if response['assembly_name'] == assembly:
            chromosome, start, end = re.split(':|-', location)
            return('chr' + chromosome, start, end)
        elif assembly == 'GRCh37':
            return assembly_mapper(location, species, 'GRCh38', assembly)
        elif assembly == 'GRCm37':
            return assembly_mapper(location, species, 'GRCm38', 'NCBIM37')
        else:
            return ('', '', '')


def format_position(position, resolution):
    chromosome, start, end = re.split(':|-', position)
    start = int(start) - resolution
    end = int(end) + resolution
    return '{}:{}-{}'.format(chromosome, start, end)


def update_viusalize(result, assembly, dataset_paths, file_statuses):
    '''Restrict visualize to assembly and add Quick View if possible.'''
    vis = result.get('visualize_batch')
    if vis is None:
        vis = {}
    assembly = _GENOME_TO_ALIAS[assembly]
    vis_assembly = vis.pop(assembly, None)
    if vis_assembly is None:
        vis_assembly = {}
    datasets = ''
    count = 0
    for path in dataset_paths:
        datasets += '&dataset=' + path
        count += 1
        # WARNING: Quick View of 100 datasets is probably of little benefit, but who are we to judge
        # if count > 25:    # NOTE: only first 25 datasets
        #    break
    if count >= 1:
        datasets = datasets[9:]  # first '&dataset=' will be redundant in vis_format_url
        pos = result.get('coordinates')
        quickview_url = vis_format_url("quickview", datasets, assembly, position=pos,
                                       file_statuses=file_statuses)
        if quickview_url is not None:
            vis_assembly['Quick View'] = quickview_url
    if not vis_assembly:
        return None
    return {assembly: vis_assembly}


def get_coordinate(query_term, assembly='GRCh37', atlas=None):
    query_term_lower = query_term.lower()
    chrom, start, end = None, None, None
    query_match = re.match(
        r'^(chr[1-9]|chr1[0-9]|chr2[0-2]|chrx|chry)(?:\s+|:)(\d+)(?:\s+|-)(\d+)',
        query_term_lower
    )
    if query_match:
        chrom, start, end = query_match.groups()
    else:
        query_match = re.match(r'^rs\d+', query_term_lower)
        if query_match:
            chrom, start, end = get_rsid_coordinates(query_match.group(0),
                                                     assembly, atlas)
    try:
        start, end = int(start), int(end)
    except (ValueError, TypeError):
        raise ValueError('Region "{}" is not recognizable.'.format(query_term))
    chrom = chrom.replace('x', 'X').replace('y', 'Y')
    if start > end:
        return chrom, end, start
    return chrom, start, end


def get_rsids(atlas, assembly, chrom, start, end):
    pos = (int(start) + int(end)) / 2
    window = int(end) - int(start)
    rsids = atlas.nearby_snps(_GENOME_TO_ALIAS.get(assembly, 'hg19'),
                              chrom, pos, window=window, max_snps=99999)
    return [rsid['rsid'] for rsid in rsids if 'rsid' in rsid]


def parse_region_query(request):
    # Get raw parameters from request
    # TODO process "format", "frame" or other params
    if request.method == 'GET':
        assembly = request.params.get('genome', 'GRCh37')
        regions = request.params.getall('regions')
        from_ = request.params.get('from', 0)
        size = request.params.get('limit', 25)
    else:  # request.method == 'POST'
        assembly = request.json_body.get('genome', 'GRCh37')
        regions = request.json_body.get('regions', [])
        if not isinstance(regions, list):
            regions = [regions]
        from_ = request.json_body.get('from', 0)
        size = request.json_body.get('limit', 25)

    # Parse parameters
    if assembly not in _GENOME_TO_ALIAS.keys():
        assembly = 'GRCh37'
    # Split lines and ignore lines here; `get_coordinate` raises ValueError and
    # doesn't handle ignoring query_term.
    region_queries = [region_query
                      for query in regions
                      for region_query in re.split(r'[\r\n]+', query)
                      if not re.match(r'^(#.*)|(\s*)$', region_query)]
    try:
        from_ = int(from_)
    except ValueError:
        from_ = 0
    if size in ('all', ''):
        size = len(region_queries)
    else:
        try:
            size = int(size)
        except ValueError:
            size = 25
    coordinates = set()
    notifications = []
    atlas = RegulomeAtlas(request.registry[SNP_SEARCH_ES])
    for region_query in region_queries:
        # Stop when got enough unique regions
        if len(coordinates) >= size:
            break
        # Get coordinate for queried region
        try:
            chrom, start, end = get_coordinate(region_query, assembly, atlas)
        except ValueError as e:
            notifications.append({region_query: 'Failed: invalid region input'})
            continue
        # Skip if scored before
        coord = '{}:{}-{}'.format(chrom, start, end)
        if coord in coordinates:
            notifications.append({region_query: 'Skipped: scored before'})
            continue
        else:
            coordinates.add(coord)

    result = {
        '@context': request.route_path('jsonld_context'),
        '@id': request.path_qs,
        'assembly': assembly,
        'coordinates': list(coordinates),
        'from': from_,
        'total': size,
        'notifications': notifications,
    }
    return result


@view_config(route_name='regulome-summary', request_method=('GET', 'POST'),
             permission='search')
def regulome_summary(context, request):
    """
    Regulome evidence analysis by region(s).
    """
    begin = time.time()  # DEBUG: timing
    result = parse_region_query(request)
    result['timing'] = [{'parse_region_query': (time.time() - begin)}]  # DEBUG: timing

    # Redirect to regulome report for single unique region query
    if len(result['coordinates']) == 1:
        query = {'region': result['coordinates'],
                 'genome': result['assembly'],
                 'from': result['from'],
                 'limit': result['total']}
        location = request.route_url('regulome-search', slash='', _query=query)
        raise HTTPSeeOther(location=location)
    result['@type'] = ['regulome-summary']
    result['title'] = 'Regulome summary'

    # No regions to search
    if result['coordinates'] == []:
        result['notifications'].append({'Failed': 'No regions found'})
        return result

    # Loop through coordinates and score each unique region
    regulome_es = request.registry[SNP_SEARCH_ES]
    atlas = RegulomeAtlas(regulome_es)
    assembly = result['assembly']
    summaries = []
    for coord in result['coordinates']:
        begin = time.time()  # DEBUG: timing
        chrom, start_end = coord.split(':')
        start, end = start_end.split('-')
        # Get rsid for the coordinate
        rsids = get_rsids(atlas, assembly, chrom, start, end)
        # Only SNP or single nucleotide are considered as scorable
        features = dict()
        regulome_score = 'N/A'
        if rsids == [] and (int(end) - int(start)) > 1:
            result['notifications'].append({coord: 'Failed: {}'.format(
                'Non-SNP or multi-nucleotide region is not scorable')})
        else:  # Scorable
            try:
                all_hits = region_get_hits(atlas, assembly, chrom, start, end)
                evidence = atlas.regulome_evidence(all_hits['datasets'])
                features = {k: k in evidence
                            for k in ['ChIP', 'DNase', 'PWM', 'Footprint',
                                      'eQTL', 'dsQTL', 'PWM_matched',
                                      'Footprint_matched']}
                regulome_score = atlas.regulome_score(all_hits['datasets'],
                                                      evidence)
                result['notifications'].append({coord: 'Success'})
            except Exception as e:
                result['notifications'].append({coord: 'Failed: (exception) {}'.format(e)})
        summaries.append({'chrom': chrom, 'start': start, 'end': end,
                          'rsids': rsids, 'features': features,
                          'regulome_score': regulome_score})
        result['timing'].append({coord: (time.time() - begin)})  # DEBUG timing
    result['summaries'] = summaries
    return result


@view_config(route_name='regulome-score', request_method='GET',
             permission='search')
def regulome_score(arg):
    test_snp_dict = {'rs4385801': ('chr10', 127511789, 127511790),
                     'rs2067749': ('chr9', 33130639, 33130640),
                     'rs11826681': ('chr11', 30344882, 30344883),
                     'rs675713': ('chr9', 136574592, 136574593),
                     'rs4284503': ('chr13', 111124254, 111124255),
                     'rs2647046': ('chr6', 32668335, 32668336),
                     'rs60093835': ('chr22', 39493355, 39493356),
                     'rs4142893': ('chr9', 126980356, 126980357),
                     'rs10937924': ('chr4', 3374897, 3374898),
                     'rs1487433': ('chr18', 21591999, 21592000),
                     'rs1129593': ('chr12', 105380151, 105380152),
                     'rs1860870': ('chr7', 150430710, 150430711),
                     'rs10829219': ('chr10', 27560119, 27560120),
                     'rs34161004': ('chr15', 93239387, 93239388),
                     'rs386542921': ('chr19', 58685050, 58685051),
                     'rs1134924': ('chr5', 179126089, 179126090),
                     'rs7170947': ('chr15', 50399671, 50399672),
                     'rs11121317': ('chr1', 9138466, 9138467),
                     'rs61743574': ('chr7', 114562422, 114562423),
                     'rs2272744': ('chr4', 4250132, 4250133),
                     'rs7563337': ('chr2', 75658963, 75658964),
                     'rs7177778': ('chr15', 81626399, 81626400),
                     'rs17635335': ('chr10', 126417180, 126417181),
                     'rs72891915': ('chr6', 33476199, 33476200),
                     'rs8092180': ('chr18', 34586879, 34586880),
                     'rs72845039': ('chr6', 27560874, 27560875),
                     'rs1260460': ('chr9', 6631098, 6631099),
                     'rs16901784': ('chr6', 26555432, 26555433),
                     'rs4481616': ('chr8', 126311068, 126311069),
                     'rs55757812': ('chr2', 56336112, 56336113),
                     'rs6533945': ('chr4', 116860122, 116860123),
                     'rs34075941': ('chr1', 175243580, 175243581),
                     'rs35350109': ('chr5', 116583758, 116583759),
                     'rs1075621': ('chr9', 140779260, 140779261),
                     'rs1976938': ('chr12', 53661924, 53661925),
                     'rs4750690': ('chr10', 130010322, 130010323),
                     'rs73057551': ('chr3', 28078189, 28078190),
                     'rs4490404': ('chr3', 46101370, 46101371),
                     'rs4945684': ('chr6', 121717494, 121717495),
                     'rs56027645': ('chr19', 54998092, 54998093),
                     'rs7168659': ('chr15', 52016498, 52016499),
                     'rs3912121': ('chr3', 137051115, 137051116),
                     'rs1571702': ('chr21', 38337195, 38337196),
                     'rs2300905': ('chr6', 88204830, 88204831),
                     'rs1883839': ('chr20', 39342791, 39342792),
                     'rs634512': ('chr12', 69754011, 69754012),
                     'rs4970774': ('chr1', 110268827, 110268828),
                     'rs1854962': ('chr1', 110269285, 110269286),
                     'rs634514': ('chr12', 69754016, 69754017),
                     'rs4496503': ('chr3', 128210062, 128210063),
                     'rs16978757': ('chr19', 12995421, 12995422),
                     'rs2072597': ('chr19', 12996739, 12996740),
                     'rs79334031': ('chr19', 12998101, 12998102),
                     'rs9825813': ('chr3', 128211243, 128211244),
                     'rs117351327': ('chr19', 12996718, 12996719),
                     'rs3922557': ('chr3', 128210025, 128210026),
                     'rs1986452': ('chr3', 128210341, 128210342),
                     'rs11712335': ('chr3', 128210549, 128210550),
                     'rs116136295': ('chr3', 128211665, 128211666),
                     'rs16978754': ('chr19', 12995402, 12995403),
                     'rs2072596': ('chr19', 12996499, 12996500),
                     'rs112631212': ('chr19', 12996928, 12996929),
                     'rs10407416': ('chr19', 12997732, 12997733),
                     'rs3817621': ('chr19', 12998204, 12998205),
                     'rs11101993': ('chr1', 110269187, 110269188)}
    try:
        # bw = pyBigWig.open("/home/ubuntu/ENCFF000CWU.bigWig")
        bw = pyBigWig.open("https://encode-files.s3.amazonaws.com/2011/01/03/383382f0-f708-4672-9dc8-ba9bf878409d/ENCFF000CWU.bigWig")
    except Exception as e:
        return {'Error': str(e)}
    else:
        return {rsid: bw.values(chrom, start, end)
                for rsid, (chrom, start, end) in test_snp_dict.items()}


@view_config(route_name='regulome-search', request_method='GET', permission='search')
def region_search(context, request):
    """
    Search files by region.
    """
    begin = time.time()  # DEBUG: timing
    types = request.registry[TYPES]
    page = request.path.split('/')[1]
    result = {
        '@id': '/' + page + '/' + ('?' + request.query_string.split('&referrer')[0]
                                   if request.query_string else ''),
        '@type': ['region-search', 'Portal'],
        'title': 'Regulome search',
        'facets': [],
        '@graph': [],
        'columns': OrderedDict(),
        'notification': '',
        'filters': [],
        'timing': []  # DEBUG: timing
    }
    principals = effective_principals(request)
    es = request.registry[ELASTIC_SEARCH]
    atlas = RegulomeAtlas(request.registry[SNP_SEARCH_ES])
    region = request.params.get('region', '*')

    # handling limit
    size = request.params.get('limit', 25)
    if size in ('all', ''):
        size = 99999
    else:
        try:
            size = int(size)
        except ValueError:
            size = 25
    if region == '':
        region = '*'

    assembly = request.params.get('genome', '*')
    result['assembly'] = _GENOME_TO_ALIAS.get(assembly, 'GRCh38')
    annotation = request.params.get('annotation', '*')
    chromosome, start, end = ('', '', '')

    result['timing'].append({'preamble': (time.time() - begin)})    # DEBUG: timing
    begin = time.time()                                             # DEBUG: timing
    rsid = None
    if annotation != '*':
        if annotation.lower().startswith('ens'):
            chromosome, start, end = get_ensemblid_coordinates(annotation, assembly)
        else:
            chromosome, start, end = get_annotation_coordinates(es, annotation, assembly)
    elif region != '*':
        region = region.lower()
        if region.startswith('rs'):
            sanitized_region = sanitize_rsid(region)
            chromosome, start, end = get_rsid_coordinates(sanitized_region, assembly, atlas)
            rsid = sanitized_region
        elif region.startswith('ens'):
            chromosome, start, end = get_ensemblid_coordinates(region, assembly)
        elif region.startswith('chr'):
            chromosome, start, end = sanitize_coordinates(region)
    else:
        chromosome, start, end = ('', '', '')
    # Check if there are valid coordinates
    if not chromosome or not start or not end:
        result['notification'] = 'No annotations found'
        return result
    else:
        result['coordinates'] = '{chr}:{start}-{end}'.format(
            chr=chromosome, start=start, end=end
        )
    result['timing'].append({'get_coords': (time.time() - begin)})  # DEBUG: timing
    begin = time.time()                                             # DEBUG: timing

    # Search for peaks for the coordinates we got
    peaks_too = ('peak_metadata' in request.query_string)
    all_hits = region_get_hits(atlas, assembly, chromosome, start, end,
                               peaks_too=peaks_too)
    result['timing'].append({'peaks': (time.time() - begin)})       # DEBUG: timing
    begin = time.time()                                             # DEBUG: timing
    result['notification'] = all_hits['message']
    if all_hits.get('dataset_count', 0) == 0:
        return result

    # if more than one peak found return the experiments with those peak files
    dataset_count = all_hits['dataset_count']
    if dataset_count > MAX_CLAUSES_FOR_ES:
        log.error("REGION_SEARCH WARNING: region covered by %d datasets is being restricted to %d"
                  % (dataset_count, MAX_CLAUSES_FOR_ES))
        all_hits['dataset_paths'] = all_hits['dataset_paths'][:MAX_CLAUSES_FOR_ES]
        dataset_count = len(all_hits['dataset_paths'])

    if dataset_count:

        # set_type = ['Experiment']
        set_indices = atlas.set_indices()
        allowed_status = atlas.allowed_statuses()
        facets = _REGULOME_FACETS

        query = get_filtered_query(
            'Dataset',
            [],
            sorted(list_result_fields(request, ['Experiment', 'Annotation'])),
            principals,
            atlas.set_type()
        )
        del query['query']
        query['post_filter']['bool']['must'].append({'terms':
                                                    {'embedded.@id': all_hits['dataset_paths']}})
        query['post_filter']['bool']['must'].append({'terms': {'embedded.status': allowed_status}})

        used_filters = set_filters(request, query, result)
        used_filters['@id'] = all_hits['dataset_paths']
        used_filters['status'] = allowed_status
        query['aggs'] = set_facets(facets, used_filters, principals, ['Dataset'])
        schemas = (types[item_type].schema for item_type in ['Experiment'])
        es_results = es.search(
            body=query, index=set_indices, doc_type=set_indices, size=size, request_timeout=60
        )
        result['@graph'] = list(format_results(request, es_results['hits']['hits']))
        result['total'] = total = es_results['hits']['total']
        result['facets'] = BaseView._format_facets(es_results, facets, used_filters, schemas, total, principals)
        if len(result['@graph']) < dataset_count:  # paths should be the chosen few
            all_hits['dataset_paths'] = [dataset['@id'] for dataset in result['@graph']]

        if peaks_too:
            result['peaks'] = all_hits['peaks']
            # TODO temperory solution before refatoring region-search
            peak_details = []
            for peak in all_hits['peaks']:
                # Get peak metadata
                dataset = peak['resident_detail']['dataset']
                method = (dataset.get('assay_term_name')
                          or dataset.get('annotation_type', ''))
                targets = dataset.get('target', [])
                biosample_term_name = dataset.get('biosample_term_name', '')
                # Get peak coordinates and assemble details
                peak_detail = [{
                                'method': method,
                                'targets': targets,
                                'biosample_term_name': biosample_term_name,
                                'chrom': peak['_index'],
                                'start': peak['_source']['coordinates']['gte'],
                                'end': peak['_source']['coordinates']['lt']
                                }]
                peak_details += peak_detail
            result['peak_details'] = peak_details

        result['download_elements'] = get_peak_metadata_links(request, result['assembly'],
                                                              chromosome, start, end)
        if result['total'] > 0:
            result['notification'] = 'Success: ' + result['notification']
            position_for_browser = format_position(result['coordinates'], 200)
            result.update(search_result_actions(request, ['Experiment'], es_results,
                          position=position_for_browser))
        result.pop('batch_download', None)  # not desired for region OR regulome

        result['timing'].append({'datasets': (time.time() - begin)})  # DEBUG: timing
        begin = time.time()                                           # DEBUG: timing
        vis = update_viusalize(result, assembly, all_hits['dataset_paths'], allowed_status)
        if vis is not None:
            result['visualize_batch'] = vis
        result['timing'].append({'visualize': (time.time() - begin)})  # DEBUG: timing
        begin = time.time()                                            # DEBUG: timing

        # score regulome SNPs or point locations
        if (rsid is not None or (int(end) - int(start)) <= 1):
            result['nearby_snps'] = atlas.nearby_snps(result['assembly'], chromosome,
                                                      int(start), rsid)
            result['timing'].append({'nearby_snps': (time.time() - begin)})  # DEBUG: timing
            begin = time.time()                                              # DEBUG: timing
            # NOTE: Needs all hits rather than 'released' or set reduced by facet selection
            evidence = atlas.regulome_evidence(all_hits['datasets'])
            features = {k: k in evidence
                        for k in ['ChIP', 'DNase', 'PWM', 'Footprint',
                                  'eQTL', 'dsQTL', 'PWM_matched',
                                  'Footprint_matched']}
            regdb_score = atlas.regulome_score(all_hits['datasets'], evidence)
            if regdb_score:
                result['regulome_score'] = regdb_score
                result['features'] = features
        result['timing'].append({'scoring': (time.time() - begin)})  # DEBUG: timing

    return result


# @view_config(route_name='jbrest', request_method='GET', permission='search')
@view_config(route_name='jbrest')
def jbrest(context, request):
    '''Limited JBrowse REST API support for select region sets'''
    # This allows including SNPs in biodalliance straight from es index and without bigBeds
    #    jbQuery: 'type=HTMLFeatures'
    #    jbURI: .../jbrest/snp141/hg19/features/chr19?start=234&end=5678
    # or jbURI: .../jbrest/snp141/GRCh38/stats/global or

    parts = request.path.split('/')
    parts.pop(0)  # Domain
    parts.pop(0)  # page: jbrest
    region_set = parts.pop(0)
    assembly = parts.pop(0)
    if region_set != 'snp141' or assembly not in ['GRCh38', 'hg19']:
        log.error('jbrest: unsupported request %s', request.url)
        return request.response

    atlas = RegulomeAtlas(request.registry['snp_search'])
    what = parts.pop(0)
    if what == 'features':
        chrom = parts.pop(0)
        if not chrom.startswith('chr'):
            chrom = 'chr' + chrom
        start = int(request.params.get('start', '-1'))
        end = int(request.params.get('end', '-1'))
        if start < 0 or end < 0 or end < start:
            log.error('jbrest: invalid coordinates %s', request.url)
            return request.response
        snps = atlas.find_snps(assembly, chrom, start, end)
        features = []
        for snp in snps:                         # quick view expects half open
            features.append({'start': snp['start'] - 1, 'end': snp['end'],
                             'name': snp['rsid'], 'uniqueID': snp['rsid']})
        request.response.content_type = 'application/json'
        request.query_string += "&format=json"
        return {'features': features}
    # elif what == 'stats':
    #    if parts[0] != 'global':
    #        log.error('jbrest: only global stats supported %s', request.url)
    #        return response
    #    counts = atlas.counts(assembly)
    #    stats = {}
    #    stats['featureCount'] = counts['SNPs'][assembly]
    #    stats['featureDensity'] = 0.02  # counts['SNPs'][assembly] / 3000000000.0
    #    response.body = bytes_(json.dumps(stats), 'utf-8')

    log.error('jbrest unknown command: %s', request.url)
    return request.response


@view_config(route_name='suggest', request_method='GET', permission='search')
def suggest(context, request):
    text = ''
    requested_genome = ''
    if 'q' in request.params:
        text = request.params.get('q', '')
        requested_genome = request.params.get('genome', '')

    result = {
        '@id': '/suggest/?' + urlencode({'genome': requested_genome, 'q': text}, ['q', 'genome']),
        '@type': ['suggest'],
        'title': 'Suggest',
        '@graph': [],
    }
    # NOTE: attempt to use suggest on SNPs in es led to es failure during indexing
    # if text.startswith('rs'):
    es = request.registry[ELASTIC_SEARCH]
    query = {
        "suggest": {
            "default-suggest": {
                "text": text,
                "completion": {
                    "field": "suggest",
                    "size": 20
                }
            }
        }
    }
    try:
        results = es.search(index='annotations', body=query)
    except Exception:
        return result
    else:
        for item in results['suggest']['default-suggest'][0]['options']:
            species = _GENOME_TO_SPECIES.get(requested_genome, 'homo_sapiens').replace('_', ' ')
            if species == item['_source']['payload']['species']:
                result['@graph'].append(item)
        result['@graph'] = result['@graph'][:10]
        return result
