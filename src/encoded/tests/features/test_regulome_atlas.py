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
    ('hg19', ('chr1', 39492461, 39492462), ['rs3768324']),
    ('hg19', ('chr10', 5894499, 5894500), ['rs10905307']),
])
def test_find_snps(assembly, location, snps, region_index, regulome_atlas):
    found = [snp['rsid'] for snp in
             regulome_atlas.find_snps(assembly, location[0], location[1], location[2])]
    assert found == snps


@pytest.mark.parametrize("assembly,location,dbpeaks", [
    ('hg19', ('chr10', 5894499, 5894500), [
        {'coordinates': {'gte': 5894432, 'lt': 5894748},
         'uuid': '956cba28-ccff-4cbd-b1c8-39db4e3de572',
         'strand': '.', 'value': '135.942930657532'},
        {'coordinates': {'gte': 5894499, 'lt': 5894500},
         'uuid': '5f921aa5-5758-4ead-846a-26af87e1a098'},
        {'coordinates': {'gte': 5888800, 'lt': 5903600},
         'uuid': '08c4c912-6713-4904-9a76-5593c560ae03',
         'value': '15_Quies'}
    ]),
])
def test_find_peaks(assembly, location, dbpeaks, region_index, regulome_atlas):
    peaks = regulome_atlas.find_peaks(assembly, location[0], location[1], location[2])

    assert len(peaks) == 3
    foundpeaks = [p['_source'] for p in peaks]
    for dbp in dbpeaks:
        assert dbp in foundpeaks


@pytest.mark.parametrize("assembly,location,dbdetails", [
    ('hg19', ('chr10', 5894499, 5894500), {
        '5f921aa5-5758-4ead-846a-26af87e1a098-28':
        {'dataset':
            {   '@id': '/annotations/ENCSR061TST/',
                'annotation_type': 'dsQTLs',
                'collection_type': 'dsQTLs',
                'biosample_term_name': 'lymphoblastoid cell line',
                'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0',
            },
         'file':
            {   '@id': '/files/ENCFF122TST/',
                'assembly': 'hg19',
                'uuid': '5f921aa5-5758-4ead-846a-26af87e1a098',
            },
        },
        '956cba28-ccff-4cbd-b1c8-39db4e3de572-296':
        {'dataset':
            {   '@id': '/experiments/ENCSR000DZQ/',
                'assay_term_name': 'ChIP-seq',
                'biosample_term_name': 'GM12878',
                'collection_type': 'ChIP-seq',
                'target': ['EBF1'],
                'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02',
          },
         'file': {   '@id': '/files/ENCFF002COS/',
                     'assembly': 'hg19',
                     'uuid': '956cba28-ccff-4cbd-b1c8-39db4e3de572',
            },
        },
        '08c4c912-6713-4904-9a76-5593c560ae03-839':
        {'dataset':
            {'@id': '/annotations/ENCSR497SKR/',
             'annotation_type': 'chromatin state',
             'biosample_term_name': 'HeLa-S3',
             'collection_type': 'chromatin state',
             'uuid': '51911c72-7c18-454f-803b-35e8416a716f'},
         'file': {'@id': '/files/ENCFF943TST/',
                  'assembly': 'hg19',
                  'uuid': '08c4c912-6713-4904-9a76-5593c560ae03'}},
    }),
])
def test_find_peaks_filtered(assembly, location, dbdetails, region_index, regulome_atlas):
    ''' this essentially tests _resident_details as well '''
    fpeaks, _ = regulome_atlas.find_peaks_filtered(assembly, location[0], location[1], location[2])
    for peak in fpeaks:
        deets = dbdetails[peak['_id']]  # this is like an assert
        for part in ('dataset', 'file'):
            assert deets[part] == peak['resident_detail'][part]


@pytest.mark.parametrize("assembly,rsid,location", [
    ('hg19', 'rs3768324', ('chr1', 39492461, 39492462)),
    ('hg19', 'rs10905307', ('chr10', 5894499, 5894500)),
])
def test_snp(assembly, rsid, location, region_index, regulome_atlas):
    snp = regulome_atlas.snp(assembly, rsid)
    assert snp['chrom'] == location[0]
    assert snp['coordinates']['gte'] == location[1]
    assert snp['coordinates']['lt'] == location[2]


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
                'ChIP': [{'biosample_term_name': 'HeLa-S3', 'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000EVI/', 'assay_term_name': 'ChIP-seq', 'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93', 'target': ['ELK4']}],
                'dsQTL': [{'biosample_term_name': 'lymphoblastoid cell line', 'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'eQTL': [{'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'eQTLs', '@id': '/annotations/ENCSR899TST/', 'annotation_type': 'eQTLs', 'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'}],
                'Footprint': [{'biosample_term_name': 'HeLa-S3','collection_type': 'Footprints', '@id': '/annotations/ENCSR228TST/', 'annotation_type': 'Footprints', 'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4', 'target': ['ELK4']}],
                'DNase': [{'biosample_term_name': 'HeLa-S3', 'collection_type': 'DNase-seq', '@id': '/experiments/ENCSR000ENO/', 'assay_term_name': 'DNase-seq', 'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'}],
                'Footprint_matched': ['ELK4'],
                'PWM': [{'biosample_term_name': 'None', 'collection_type': 'PWMs', '@id': '/annotations/ENCSR333TST/', 'annotation_type': 'PWMs', 'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc', 'target': ['ELK4']}],
                'PWM_matched': ['ELK4'],
                'ChIP_max_signal': 460.9580078125,
                'DNase_max_signal': 5.474899768829346,
                'IC_matched_max': 1.9966800212860107,
                'IC_max': 1.9991999864578247,
            },
            'coordinates': {'lt': 39492462, 'gte': 39492461},
            'strand': '-',
            'score': '0.8136 (probability); 1a (ranking v1.1)',
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 5894500, 100000,
        [{
            'evidence': {
                'ChIP': [{'biosample_term_name': 'GM12878', 'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000DZQ/', 'target': ['EBF1'], 'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02', 'biosample_term_name': 'GM12878', 'assay_term_name': 'ChIP-seq'}],
                'dsQTL': [{ 'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'ChIP_max_signal': 9.485400199890137,
                'DNase_max_signal': 0.6291999816894531,
                'IC_matched_max': False,
                'IC_max': False,
            },
            'coordinates': {'lt': 5894500, 'gte': 5894499},
            'strand': '+',
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
                'ChIP': [{'biosample_term_name': 'HeLa-S3', 'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000EVI/', 'assay_term_name': 'ChIP-seq', 'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93', 'target': ['ELK4']}],
                'dsQTL': [{'biosample_term_name': 'lymphoblastoid cell line', 'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'eQTL': [{'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'eQTLs', '@id': '/annotations/ENCSR899TST/', 'annotation_type': 'eQTLs', 'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'}],
                'Footprint': [{'biosample_term_name': 'HeLa-S3', 'collection_type': 'Footprints', '@id': '/annotations/ENCSR228TST/', 'annotation_type': 'Footprints', 'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4', 'target': ['ELK4']}],
                'DNase': [{'biosample_term_name': 'HeLa-S3', 'collection_type': 'DNase-seq', '@id': '/experiments/ENCSR000ENO/', 'assay_term_name': 'DNase-seq', 'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'}],
                'Footprint_matched': ['ELK4'],
                'PWM': [{'biosample_term_name': 'None', 'collection_type': 'PWMs', '@id': '/annotations/ENCSR333TST/', 'annotation_type': 'PWMs', 'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc', 'target': ['ELK4']}],
                'PWM_matched': ['ELK4'],
                'ChIP_max_signal': 460.9580078125,
                'DNase_max_signal': 5.474899768829346,
                'IC_matched_max': 1.9966800212860107,
                'IC_max': 1.9991999864578247,
            },
            'coordinates': {'lt': 39492462, 'gte': 39492461},
            'strand': '-',
            'score': '0.8136 (probability); 1a (ranking v1.1)',
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 5894500, 100000,
        [{
            'evidence': {
                'ChIP': [{'biosample_term_name': 'GM12878', 'collection_type': 'ChIP-seq', '@id': '/experiments/ENCSR000DZQ/', 'target': ['EBF1'], 'uuid': 'd9161058-d8c4-4b17-b03b-bfaeabe75e02', 'assay_term_name': 'ChIP-seq'}],
                'dsQTL': [{'biosample_term_name': 'lymphoblastoid cell line', 'collection_type': 'dsQTLs', '@id': '/annotations/ENCSR061TST/', 'annotation_type': 'dsQTLs', 'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'}],
                'ChIP_max_signal': 9.485400199890137,
                'DNase_max_signal': 0.6291999816894531,
                'IC_matched_max': False,
                'IC_max': False,
            },
            'coordinates': {'lt': 5894500, 'gte': 5894499},
            'strand': '+',
            'score': '0.18499 (probability); 1f (ranking v1.1)',
            'rsid': 'rs10905307',
            'assembly': 'hg19',
            'chrom': 'chr10'
        }])
])
def test_nearby_snps_scored(assembly, chrom, pos, window, result, region_index, regulome_atlas):

    scored_snps = regulome_atlas.nearby_snps(assembly, chrom, pos, window=window, scores=True)
    #  sthis returns empty generator which seems wrong.
    for idx, snp in enumerate(scored_snps):
        assert snp == result[idx]
        idx = idx + 1
    assert len(result) == idx


@pytest.mark.parametrize("assembly,rsid,location", [
    ('GRCh37', 'rs3768324',  ('chr1', 39492461, 39492462)),
    ('GRCh37', 'rs10905307', ('chr10', 5894499, 5894500)),
])
def test_get_rsid_coordinates(rsid, assembly, location, regulome_atlas):
    from encoded import regulome_search
    coords = regulome_search.get_rsid_coordinates(rsid, assembly, atlas=regulome_atlas, webfetch=False)
    assert coords == location


@pytest.mark.parametrize("assembly,rsid,location", [
    ('GRCh37', 'rs3768324',  ('chr1', 39492461, 39492462)),
    ('GRCh37', 'rs10905307', ('chr10', 5894499, 5894500)),
])
def test_get_rsid_coordinates_internet(rsid, assembly, location):
    from encoded import regulome_search
    coords = regulome_search.get_rsid_coordinates(rsid, assembly, atlas=None, webfetch=True)
    assert coords == location
