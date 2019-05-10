""" Test RegulomeAtlas functions
    * depends on indexing
    * Regulome scoring tested in test_regulome.py
"""

import pytest

pytestmark = [pytest.mark.indexing]

@pytest.mark.parametrize("assembly,location,snps", [
    ('hg19', ('chr1', 39492462, 39492462), ['rs3768324']),
    ('hg19', ('chr10', 5894500, 5894500), ['rs10905307']),
])
def test_find_snps(assembly, location, snps, region_index, testapp, registry):
    from encoded.regulome_atlas import RegulomeAtlas
    from snovault.elasticsearch import interfaces # NOQA
    atlas = RegulomeAtlas(registry[interfaces.SNP_SEARCH_ES])
    found = [snp['rsid'] for snp in
             atlas.find_snps(assembly, location[0], location[1], location[2])]
    assert found == snps
