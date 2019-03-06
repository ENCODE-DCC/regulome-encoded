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
    assert res.json['title'] == 'region_indexer'
    sleep(5)  # For some reason testing fails without some winks

    res = testapp.get('http://0.0.0.0:6543/regulome-search/?region=rs3768324&genome=GRCh37')
    # import json
    # print(json.dumps(res.json, indent=4, sort_keys=True))
    # print(json.dumps({e['accession'] for e in res.json['@graph']}, indent=4, sort_keys=True))
    assert res.json['title'] == 'Regulome search'
    assert res.json['@type'] == ['region-search', 'Portal']
    assert res.json['notification'] == 'Success: 7 peaks in 7 files belonging to 7 datasets in this region'
    assert res.json['regulome_score'] == '1a'
    assert res.json['coordinates'] == 'chr1:39492462-39492462'
    assert {e['accession'] for e in res.json['@graph']} == {
        'ENCSR228TST', 'ENCSR061TST', 'ENCSR000DCE', 'ENCSR333TST',
        'ENCSR899TST', 'ENCSR000ENO', 'ENCSR000EVI'
    }
    expected = [
        'http://0.0.0.0:6543/regulome_download/regulome_evidence_hg19_chr1_39492462_39492462.bed',
        'http://0.0.0.0:6543/regulome_download/regulome_evidence_hg19_chr1_39492462_39492462.json'
    ]
    assert res.json['download_elements'] == expected


def test_regulome_score(testapp, workbook):
    res = testapp.post_json('/index', {'record': True})
    res = testapp.post_json('/index_region', {'record': True})
    sleep(5)  # For some reason testing fails without some winks

    res = testapp.get('http://0.0.0.0:6543/regulome-search/?region=rs3768324&genome=GRCh37')
    assert res.json['regulome_score'] == '1a'
