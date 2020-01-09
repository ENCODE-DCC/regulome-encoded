from pyramid.httpexceptions import HTTPSeeOther
from pyramid.httpexceptions import HTTPTemporaryRedirect
from pyramid.view import view_config
from snovault.elasticsearch.interfaces import (
    ELASTIC_SEARCH,
    SNP_SEARCH_ES
)
from .regulome_atlas import RegulomeAtlas
from .vis_defines import (
    vis_format_url
)
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
    rsids = atlas.find_snps(
        _GENOME_TO_ALIAS.get(assembly, 'hg19'), chrom, start, end
    )
    return [rsid['rsid'] for rsid in rsids if 'rsid' in rsid]


def parse_region_query(request):
    # Get raw parameters from request
    # TODO process "format", "frame" or other params
    if request.method == 'GET':
        assembly = request.params.get('genome', 'GRCh37')
        regions = request.params.getall('regions')
        from_ = request.params.get('from', 0)
        size = request.params.get('limit', 200)
        format = request.params.get('format', 'json')
    else:  # request.method == 'POST'
        assembly = request.json_body.get('genome', 'GRCh37')
        regions = request.json_body.get('regions', [])
        if not isinstance(regions, list):
            regions = [regions]
        from_ = request.json_body.get('from', 0)
        size = request.json_body.get('limit', 200)
        format = request.json_body.get('format', 'json')

    # Parse parameters
    if assembly not in _GENOME_TO_ALIAS.keys():
        assembly = 'GRCh37'
    # Split lines and ignore lines here; `get_coordinate` raises ValueError and
    # doesn't handle ignoring query_term.
    region_queries = [region_query
                      for query in regions
                      for region_query in re.split(r'[\r\n]+', query)
                      if not re.match(r'^(#.*)|(\s*)$', region_query)]

    variants = dict()
    notifications = {}
    atlas = RegulomeAtlas(request.registry[SNP_SEARCH_ES])
    # Return query coordinates. i.e. dbSNP ID inputs will be mapped, so that
    # 1) Users can double check their queries in return results;
    # 2) regulome_search will use and will only use one single coordinate from
    # this list.
    query_coordinates = []
    for region_query in region_queries:
        # Get coordinate for queried region
        try:
            chrom, start, end = get_coordinate(region_query, assembly, atlas)
        except ValueError:
            notifications[region_query] = 'Failed: invalid region input'
            continue
        query_coordinates.append('{}:{}-{}'.format(chrom, int(start), int(end)))
        snps = atlas.find_snps(
            _GENOME_TO_ALIAS.get(assembly, 'hg19'), chrom, start, end
        )
        if not snps:
            if (int(end) - int(start)) > 1:
                notifications[region_query] = (
                    'Failed: no known variants found in this multi-nucleotide '
                    'region.'
                )
                continue
            else:
                variants['{}:{}-{}'.format(chrom, int(start), int(end))] = set()
        for snp in snps:
            coord = '{}:{}-{}'.format(
                snp['chrom'],
                snp['coordinates']['gte'],
                snp['coordinates']['lt']
            )
            if coord in variants:
                variants[coord].add(snp['rsid'])
            else:
                variants[coord] = {snp['rsid']}

    total = len(variants)
    try:
        from_ = max(int(from_), 0)
    except ValueError:
        from_ = 0
    if size in ('all', ''):
        to_ = total
    else:
        try:
            to_ = min(from_ + max(int(size), 0), total)
        except ValueError:
            to_ = min(from_ + 200, total)

    result = {
        '@context': request.route_path('jsonld_context'),
        '@id': request.path_qs,
        'assembly': assembly,
        'query_coordinates': query_coordinates,
        'format': format,
        'from': from_,
        'total': total,
        'variants': {k: list(v) for k, v in sorted(variants.items())[from_:to_]},
        'notifications': notifications,
    }
    return result


def evidence_to_features(evidence):
    features = {
        'ChIP': False,
        'DNase': False,
        'PWM': False,
        'Footprint': False,
        'QTL': False,
        'PWM_matched': False,
        'Footprint_matched': False,
        'IC_matched_max': 0.0,
        'IC_max': 0.0,
    }
    for k in features:
        if isinstance(features[k], float):
            features[k] = evidence.get(k, 0.0)
        else:
            features[k] = k in evidence
    return features


@view_config(route_name='regulome-summary', request_method=('GET', 'POST'),
             permission='search')
def regulome_summary(context, request):
    """
    Regulome evidence analysis by region(s).
    """
    begin = time.time()  # DEBUG: timing
    result = parse_region_query(request)
    result['format'] = result['format'].lower()
    result['timing'] = [{'parse_region_query': (time.time() - begin)}]  # DEBUG: timing

    # Redirect to regulome report for single unique region query
    if len(result['variants']) == 1:
        query = {'regions': [v for v in result['variants']][0],
                 'genome': result['assembly']}
        location = request.route_url('regulome-search', slash='', _query=query)
        raise HTTPSeeOther(location=location)

    result['@type'] = ['regulome-summary']
    result['title'] = 'Regulome summary'

    # No regions to search
    if not result['variants']:
        # Just in case no message is recorded during parse_region_query
        if not result['notifications']:
            result['notifications'] = {'Failed': 'No variants found'}
        return result

    # Loop through coordinates and score each unique region
    regulome_es = request.registry[SNP_SEARCH_ES]
    atlas = RegulomeAtlas(regulome_es)
    assembly = result['assembly']
    summaries = []
    for coord in result['variants']:
        begin = time.time()  # DEBUG: timing
        chrom, start_end = coord.split(':')
        start, end = start_end.split('-')
        # Get rsid for the coordinate
        rsids = result['variants'][coord]
        # parse_region_query makes sure variants returned are all scorable
        try:
            all_hits = region_get_hits(atlas, assembly, chrom, start, end)
            evidence = atlas.regulome_evidence(all_hits['datasets'], chrom, int(start), int(end))
            regulome_score = atlas.regulome_score(all_hits['datasets'],
                                                  evidence)
            features = evidence_to_features(evidence)
        except Exception:
            features = {}
            regulome_score = {}
        if result['format'] in ['tsv', 'bed']:
            if not summaries:
                columns = ['chrom', 'start', 'end', 'rsids']
                columns.extend(sorted(regulome_score.keys()))
                columns.extend(sorted(features.keys()))
                if result['format'] == 'tsv':
                    summaries.append('\t'.join(columns).encode())
            row = [chrom, start, end, ', '.join(rsids)]
            row.extend([
                str(features.get(col, '')) or str(regulome_score.get(col, ''))
                for col in columns
                if col in regulome_score or col in features
            ])
            summaries.append('\t'.join(row).encode())
        else:
            summaries.append({
                'chrom': chrom,
                'start': start,
                'end': end,
                'rsids': rsids,
                'features': features,
                'regulome_score': regulome_score
            })
        result['timing'].append({coord: (time.time() - begin)})  # DEBUG timing
    if result['format'] in ['tsv', 'bed']:
        request.response.content_type = 'text/tsv'
        request.response.content_disposition = (
            'attachment;filename="regulome_{}.{}"'.format(
                time.strftime('%Y%m%d-%Hh%Mm%Ss'), result['format']
            )
        )
        request.response.app_iter = (row + b'\n' for row in summaries)
        return request.response
    result['summaries'] = summaries
    return result


@view_config(route_name='regulome-search', request_method='GET', permission='search')
def regulome_search(context, request):
    """
    Regulome peak analysis for a single region.
    """
    if 'from' in request.params or 'size' in request.params:
        return {
            '@context': request.route_path('jsonld_context'),
            '@id': request.path_qs,
            '@type': ['regulome-search'],
            'notifications': {
                'Failed': 'Invalid parameters: "from" and "size" are not accepted.'
            },
            'title': 'Regulome search',
        }
    begin = time.time()  # DEBUG: timing
    result = parse_region_query(request)
    result['@type'] = ['regulome-search']
    result['title'] = 'Regulome search'
    result['timing'] = [{'parse_region_query': (time.time() - begin)}]  # DEBUG: timing

    if len(result['query_coordinates']) != 1:
        result['notifications'] = {
            'Failed': 'Received {} region queries. Exact one region or one '
            'variant can be processed by regulome-search'.format(
                len(result['query_coordinates'])
            )
        }
        return result

    # Start search
    begin = time.time()  # DEBUG: timing
    regulome_es = request.registry[SNP_SEARCH_ES]
    atlas = RegulomeAtlas(regulome_es)
    assembly = result['assembly']
    coord = result['query_coordinates'][0]
    chrom, start_end = coord.split(':')
    start, end = start_end.split('-')

    try:
        all_hits = region_get_hits(
            atlas, assembly, chrom, start, end, peaks_too=True
        )
        evidence = atlas.regulome_evidence(
            all_hits['datasets'], chrom, int(start), int(end)
        )
        result['regulome_score'] = atlas.regulome_score(
            all_hits['datasets'], evidence
        )
        result['features'] = evidence_to_features(evidence)
    except Exception as e:
        result['notifications'][coord] = 'Failed: (exception) {}'.format(e)
    peak_details = []
    for peak in all_hits.get('peaks', []):
        peak_details.append({
            'chrom': peak['_index'],
            'start': peak['_source']['coordinates']['gte'],
            'end': peak['_source']['coordinates']['lt'],
            'strand': peak['_source'].get('strand'),
            'value': peak['_source'].get('value'),

            'file': peak['resident_detail']['file']['@id'].split('/')[2],

            'dataset': peak['resident_detail']['dataset']['@id'],
            'documents': peak['resident_detail']['dataset']['documents'],
            'biosample_ontology': peak['resident_detail']['dataset']['biosample_ontology'],
            'method': peak['resident_detail']['dataset']['collection_type'],
            'targets': peak['resident_detail']['dataset'].get('target', []),
        })
    result['@graph'] = peak_details
    result['timing'].append({'regulome_search_scoring': (time.time() - begin)})  # DEBUG: timing

    begin = time.time()  # DEBUG: timing
    result['nearby_snps'] = atlas.nearby_snps(
        _GENOME_TO_ALIAS.get(assembly, 'hg19'),
        chrom,
        int(start),
        # No guarentee the query coordinate corresponds to one RefSNP.
        max_snps=len(result['variants'].get(coord, []))+10
    )
    result['timing'].append({'nearby_snps': (time.time() - begin)})  # DEBUG: timing
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
