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


@pytest.mark.xfail()
@pytest.mark.parametrize("assembly,chrom,pos", [
    ('hg19', 'chr1', 39492462),
    ('hg19', 'chr10', 104574063),
])
def test_nearby_snps_scores(assembly, chrom, pos, region_index, regulome_atlas):

    snps = regulome_atlas.nearby_snps(assembly, chrom, pos, window=100000, scores=True)
    # this returns empty generator which seems wrong.
    assert False
