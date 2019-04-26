""" Test Regulome functions
    * Region/Regulome indexing
    * Regulome scoring
"""

import pytest
from time import sleep

pytestmark = [pytest.mark.indexing]


def test_one_regulome(testapp, workbook):
    res = testapp.post_json('/index', {'record': True})
    assert res.json['title'] == 'primary_indexer'
    res = testapp.post_json('/index_region', {'record': True})
    assert res.json['title'] == 'regulome_indexer'
    sleep(5)  # For some reason testing fails without some winks

    res = testapp.get('/regulome-search/?region=rs3768324&genome=GRCh37')
    assert res.json['title'] == 'Regulome search'
    assert res.json['@type'] == ['region-search', 'Portal']
    assert res.json['notification'] == 'Success: 7 peaks in 7 files belonging to 7 datasets in this region'
    assert res.json['regulome_score'] == '0.8136 (probability); 1a (ranking v1.1)'
    assert res.json['coordinates'] == 'chr1:39492462-39492462'
    assert {e['accession'] for e in res.json['@graph']} == {
        'ENCSR228TST', 'ENCSR061TST', 'ENCSR000DCE', 'ENCSR333TST',
        'ENCSR899TST', 'ENCSR000ENO', 'ENCSR000EVI'
    }
    expected = [
        'http://localhost/regulome_download/regulome_evidence_hg19_chr1_39492462_39492462.bed',
        'http://localhost/regulome_download/regulome_evidence_hg19_chr1_39492462_39492462.json'
    ]
    assert res.json['download_elements'] == expected


def test_regulome_score(testapp, workbook):
    res = testapp.post_json('/index', {'record': True})
    res = testapp.post_json('/index_region', {'record': True})
    sleep(5)  # For some reason testing fails without some winks

    res = testapp.get('/regulome-search/?region=rs3768324&genome=GRCh37')
    assert res.json['regulome_score'] == '0.8136 (probability); 1a (ranking v1.1)'


def test_regulome_summary(testapp, workbook):
    res = testapp.post_json('/index', {'record': True})
    res = testapp.post_json('/index_region', {'record': True})
    sleep(5)  # For some reason testing fails without some winks
    summary_query_url = 'http://0.0.0.0:6543/regulome-summary/?regions={}&genome=GRCh37'

    region_query = ('%23This is a comment line %0A'
                    'chr1:39492462-39492462 rs3768324 %0A'
                    'rs75982468 %0D'
                    'chr10 5894500 %09 5894500 rs10905307 %0A%0D'
                    'This is an invalid region query %0D%0A')
    res = testapp.get(summary_query_url.format(region_query))
    import json
    print(json.dumps(res.json, indent=4, sort_keys=True))
    res_notes = sorted(res.json['notifications'], key=lambda x: next(iter(x)))
    expected_notes = [
        {"This is an invalid region query ": "Failed: invalid region input"},
        {"chr10:11741181-11741181": "Success"},
        {"chr10:5894500-5894500": "Success"},
        {"chr1:39492462-39492462": "Success"},
    ]
    assert res_notes == expected_notes


@pytest.mark.parametrize("query_term,expected,valid", [
    ('chrx:5894500-5894500', ('chrX', 5894500, 5894500), True),
    ('chr10:5894500-5894500extra string ', ('chr10', 5894500, 5894500), True),
    ('chr10 5894500\t5894500\trs10905307', ('chr10', 5894500, 5894500), True),
    ('rs10905307\textra string', ('chr10', 5894500, 5894500), True),
])
def test_get_coordinate(query_term, expected, valid):
    from encoded.regulome_search import get_coordinate
    if valid:
        assert get_coordinate(query_term) == expected
    else:
        error_msg = 'Region "{}" is not recognizable.'.format(query_term)
        with pytest.raises(ValueError) as excinfo:
            get_coordinate(query_term)
        assert str(excinfo.value) == error_msg


@pytest.mark.parametrize("assembly,location,snps", [
    ('hg19', ('chr1', 39492462, 39492462), ['rs3768324']),
    ('hg19', ('chr10', 5894500, 5894500), ['rs10905307']),
])
def test_find_snps(assembly, location, snps, testapp, workbook, registry):
    from encoded.regulome_atlas import RegulomeAtlas
    from snovault.elasticsearch import interfaces # NOQA
    atlas = RegulomeAtlas(registry[interfaces.SNP_SEARCH_ES])
    found = [snp['rsid'] for snp in 
             atlas.find_snps(assembly, location[0], location[1], location[2])]
    assert found == snps
