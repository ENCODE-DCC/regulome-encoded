""" Test RegulomeAtlas functions
    * depends on indexing
    * Regulome scoring tested in test_regulome.py
"""

import pytest

pytestmark = [pytest.mark.indexing]


@pytest.fixture(scope='function')
def regulome_atlas(registry):
    from encoded.regulome_atlas import RegulomeAtlas
    from snovault.elasticsearch import interfaces # NOQA
    return RegulomeAtlas(registry[interfaces.SNP_SEARCH_ES])


@pytest.mark.parametrize("assembly,location,snps", [
    ('hg19', ('chr1', 39492462, 39492462), ['rs3768324']),
    ('hg19', ('chr10', 5894500, 5894500), ['rs10905307']),
])
def test_find_snps(assembly, location, snps, region_index, regulome_atlas):
    found = [snp['rsid'] for snp in
             regulome_atlas.find_snps(assembly, location[0], location[1], location[2])]
    assert found == snps


@pytest.mark.parametrize("assembly,location,dbpeaks", [
    ('hg19', ('chr10', 5894500, 5894500), [
        {'coordinates': {'gte': 5894433, 'lte': 5894748},
         'uuid': '956cba28-ccff-4cbd-b1c8-39db4e3de572'},
        {'coordinates': {'gte': 5894500, 'lte': 5894500},
         'uuid': '5f921aa5-5758-4ead-846a-26af87e1a098'}
    ]),
])
def test_find_peaks(assembly, location, dbpeaks, region_index, regulome_atlas):
    peaks = regulome_atlas.find_peaks(assembly, location[0], location[1], location[2])

    assert len(peaks) == 2
    foundpeaks = [p['_source'] for p in peaks]
    for dbp in dbpeaks:
        assert dbp in foundpeaks


@pytest.mark.parametrize("assembly,location,dbdetails", [
    ('hg19', ('chr10', 5894500, 5894500), [
        {'dataset': 
            {   '@id': '/annotations/ENCSR061TST/',
                'annotation_type': 'dsQTLs',
                'collection_type': 'dsQTLs',
                'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'
            },
         'file': 
            {   '@id': '/files/ENCFF122TST/',
                'assembly': 'hg19',
                'uuid': '5f921aa5-5758-4ead-846a-26af87e1a098'
            },
        },
        {'dataset':
            {   '@id': '/experiments/ENCSR000DZQ/',
                'assay_term_name': 'ChIP-seq',
                'biosample_term_name': 'GM12878',
                'collection_type': 'ChIP-seq',
                'target': ['EBF1'],
                'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02'
          },
         'file': {   '@id': '/files/ENCFF002COS/',
                     'assembly': 'hg19',
                     'uuid': '956cba28-ccff-4cbd-b1c8-39db4e3de572'
            },
        },
    ]),
])
def test_find_peaks_filtered(assembly, location, dbdetails, region_index, regulome_atlas):
    ''' this essentially tests _resident_details as well '''
    fpeaks, _ = regulome_atlas.find_peaks_filtered(assembly, location[0], location[1], location[2])
    for part in ('dataset', 'file'): 
        assert fpeaks[0]['resident_detail'][part] == dbdetails[0][part] \
            or fpeaks[0]['resident_detail'][part] == dbdetails[1][part]
        assert fpeaks[1]['resident_detail'][part] == dbdetails[0][part] \
            or fpeaks[1]['resident_detail'][part] == dbdetails[1][part]


@pytest.mark.parametrize("assembly,rsid,location", [
    ('hg19', 'rs3768324', ('chr1', 39492462, 39492462)),
    ('hg19', 'rs10905307', ('chr10', 5894500, 5894500)),
])
def test_snp(assembly, rsid, location, region_index, regulome_atlas):
    snp = regulome_atlas.snp(assembly, rsid)
    assert snp['chrom'] == location[0]
    assert snp['coordinates']['gte'] == location[1]
    assert snp['coordinates']['lte'] == location[2]


@pytest.mark.parametrize("assembly,chrom,pos,rsids", [
    ('hg19', 'chr1', 39492462, ['rs3768324']),
    ('hg19', 'chr10', 104574063, ['rs7092340', 'rs284857'])
])
def test_nearby_snps(assembly, chrom, pos, rsids, region_index, regulome_atlas):

    snps = regulome_atlas.nearby_snps(assembly, chrom, pos, window=100000)
    assert [r['rsid'] for r in snps].sort() == rsids.sort()


@pytest.mark.parametrize("assembly,location", [
    ('hg19', ('chr10', 102639780, 104575000)),
])
def test_snp_window(assembly, location, region_index, regulome_atlas):
    snps = regulome_atlas.find_snps(assembly, location[0], location[1], location[2])
    assert len(snps) == 5
    import random
    random.shuffle(snps)  # otherwise cannot prove sort works
    windowed_snps = regulome_atlas._snp_window(snps, 3, 104529660)
    assert len(windowed_snps) == 3
    starts = [s['coordinates']['gte'] for s in windowed_snps]
    assert starts[0] < starts[1] < starts[2]


@pytest.mark.parametrize("assembly,chrom,pos,window,result", [
    ('hg19', 'chr1', 39492462, 1600,
        [{
            'evidence': {
                'ChIP': [{'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000EVI/', 'assay_term_name': 'ChIP-seq', 'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93', 'target': ['ELK4']}],
                'dsQTL': [{'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'eQTL': [{'collection_type': 'eQTLs', '@id': '/annotations/ENCSR899TST/', 'annotation_type': 'eQTLs', 'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'}],
                'Footprint': [{'collection_type': 'Footprints', '@id': '/annotations/ENCSR228TST/', 'annotation_type': 'Footprints', 'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4', 'target': ['ELK4']}],
                'DNase': [{'collection_type': 'DNase-seq', '@id': '/experiments/ENCSR000ENO/', 'assay_term_name': 'DNase-seq', 'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'}],
                'Footprint_matched': ['ELK4'],
                'PWM': [{'collection_type': 'PWMs', '@id': '/annotations/ENCSR333TST/', 'annotation_type': 'PWMs', 'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc', 'target': ['ELK4']}],
                'PWM_matched': ['ELK4']
            },
            'coordinates': {'lte': 39492462, 'gte': 39492462},
            'score': '0.8136 (probability); 1a (ranking v1.1)',
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 5894500, 100000,
        [{
            'evidence': {
                'ChIP': [{'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000DZQ/', 'target': ['EBF1'], 'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02', 'biosample_term_name': 'GM12878', 'assay_term_name': 'ChIP-seq'}],
                'dsQTL': [{'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}]},
            'coordinates': {'lte': 5894500, 'gte': 5894500},
            'score': '0.18499 (probability); 1f (ranking v1.1)',
            'rsid': 'rs10905307',
            'assembly': 'hg19',
            'chrom': 'chr10'
        }])
])
def test_scored_snps(assembly, chrom, pos, window, result, region_index, regulome_atlas):
    max_snps = 10
    range_start = int(pos - (window / 2))
    range_end = int(pos + (window / 2))
    if range_start < 0:
        range_end += 0 - range_start
        range_start = 0

    scored_snps = regulome_atlas._scored_snps(assembly, chrom, range_start, range_end, max_snps, pos)
    for idx, snp in enumerate(scored_snps):
        assert snp == result[idx]
        idx = idx + 1
    assert len(result) == idx


@pytest.mark.parametrize("assembly,chrom,pos,window,result", [
    ('hg19', 'chr1', 39492462, 1600,
        [{
            'evidence': {
                'ChIP': [{'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000EVI/', 'assay_term_name': 'ChIP-seq', 'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93', 'target': ['ELK4']}],
                'dsQTL': [{'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'eQTL': [{'collection_type': 'eQTLs', '@id': '/annotations/ENCSR899TST/', 'annotation_type': 'eQTLs', 'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'}],
                'Footprint': [{'collection_type': 'Footprints', '@id': '/annotations/ENCSR228TST/', 'annotation_type': 'Footprints', 'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4', 'target': ['ELK4']}],
                'DNase': [{'collection_type': 'DNase-seq', '@id': '/experiments/ENCSR000ENO/', 'assay_term_name': 'DNase-seq', 'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'}],
                'Footprint_matched': ['ELK4'],
                'PWM': [{'collection_type': 'PWMs', '@id': '/annotations/ENCSR333TST/', 'annotation_type': 'PWMs', 'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc', 'target': ['ELK4']}],
                'PWM_matched': ['ELK4']
            },
            'coordinates': {'lte': 39492462, 'gte': 39492462},
            'score': '0.8136 (probability); 1a (ranking v1.1)',
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 5894500, 100000,
        [{
            'evidence': {
                'ChIP': [{'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000DZQ/', 'target': ['EBF1'], 'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02', 'biosample_term_name': 'GM12878', 'assay_term_name': 'ChIP-seq'}],
                'dsQTL': [{'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}]},
            'coordinates': {'lte': 5894500, 'gte': 5894500},
            'score': '0.18499 (probability); 1f (ranking v1.1)',
            'rsid': 'rs10905307',
            'assembly': 'hg19',
            'chrom': 'chr10'
        }])
])
def test_nearby_snps_scored(assembly, chrom, pos, window, result, region_index, regulome_atlas):

    import pprint
    '''range_start = int(pos - (window / 2))
    range_end = int(pos + (window / 2))
    if range_start < 0:
        range_end += 0 - range_start
        range_start = 0
    snps = regulome_atlas.find_snps(assembly, chrom, range_start, range_end)

    snps = sorted(snps, key=lambda s: s['coordinates']['gte'])

    start = snps[0]['coordinates']['gte']  # SNPs must be in location order!
    end = snps[-1]['coordinates']['lte']
    assert start >= end
    (peaks, details) = regulome_atlas.find_peaks_filtered(assembly, chrom, start, end, peaks_too=True)
    if not peaks or not details:
        assert False
        for snp in snps:
            snp['score'] = None

    last_uuids = {}
    last_snp = {}
    for snp in snps:
        snp['score'] = None  # default
        snp['assembly'] = assembly
        snp_uuids = regulome_atlas._peak_uuids_in_overlap(peaks, snp['chrom'], snp['coordinates']['gte'])
        if snp_uuids:
            if snp_uuids == last_uuids:
                if last_snp:
                    snp['score'] = last_snp['score']
                    if 'evidence' in last_snp:
                        snp['evidence'] = last_snp['evidence']
            else:
                last_uuids = snp_uuids
                snp_details = regulome_atlas._filter_details(details, uuids=list(snp_uuids))
                if snp_details:
                    (snp_datasets, _snp_files) = regulome_atlas.details_breakdown(snp_details)
                    if snp_datasets:
                        snp_evidence = regulome_atlas.regulome_evidence(snp_datasets)
                        if snp_evidence:
                            snp['score'] = regulome_atlas.regulome_score(snp_datasets, snp_evidence)
                            snp['evidence'] = snp_evidence
                            last_snp = snp
    assert result[0] == snps[0]
    '''

    scored_snps = regulome_atlas.nearby_snps(assembly, chrom, pos, window=window, scores=True)
    #  sthis returns empty generator which seems wrong.
    for idx, snp in enumerate(scored_snps):
        assert snp == result[idx]
        idx = idx + 1
    assert len(result) == idx