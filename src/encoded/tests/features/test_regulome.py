""" Test Regulome functions
    * Region/Regulome indexing
    * Regulome scoring
"""

import pytest
import encoded.regulome_search

pytestmark = [pytest.mark.indexing]


def test_one_regulome(testapp, workbook, region_index):
    res = testapp.get('/regulome-search/?regions=rs3768324&genome=GRCh37')
    assert res.json['title'] == 'Regulome search'
    assert res.json['@type'] == ['regulome-search']
    assert len(res.json['@graph']) == 8
    assert res.json['regulome_score'] == {'probability': '0.99267', 'ranking': '1a'}
    assert 'chr1:39492461-39492462' in res.json['query_coordinates']
    assert {e['dataset'] for e in res.json['@graph']} == {
        '/annotations/ENCSR228TST/', '/annotations/ENCSR061TST/',
        '/experiments/ENCSR000DCE/', '/annotations/ENCSR333TST/',
        '/annotations/ENCSR899TST/', '/experiments/ENCSR000ENO/',
        '/experiments/ENCSR000EVI/', '/annotations/ENCSR497SKR/'
    }


def test_dataset_size(testapp, workbook, region_index):
    ''' this doesn't actually test size but makes sure some properties were removed '''
    res = testapp.get('/regulome-search/?regions=rs10905307&genome=GRCh37')
    assert len(res.json['@graph']) == 3
    assert res.json['regulome_score'] == {'probability': '0.54789', 'ranking': '1f'}
    assert 'chr10:5894499-5894500' in res.json['query_coordinates']
    assert {e['dataset'] for e in res.json['@graph']} == {
        '/annotations/ENCSR061TST/',
        '/experiments/ENCSR000DZQ/',
        '/annotations/ENCSR497SKR/'
    }
    assert {
        e['biosample_ontology']['term_name'] for e in res.json['@graph']
    } == {'GM12878', 'lymphoblastoid cell line', 'HeLa-S3'}
    assert 'files' not in [res.json['@graph'][0].keys()]
    assert {
        e.get('method', '') for e in res.json['@graph']
    } == {'dsQTLs', 'ChIP-seq', 'chromatin state'}


def test_regulome_score(testapp, workbook, region_index):
    res = testapp.get('/regulome-search/?regions=rs3768324&genome=GRCh37')
    assert res.json['regulome_score'] == {'probability': '0.99267', 'ranking': '1a'}


def test_regulome_summary(testapp, workbook, region_index):
    summary_query_url = 'http://0.0.0.0:6543/regulome-summary/?regions={}&genome=GRCh37'

    region_query = ('%23This is a comment line %0A'
                    'chr1:39492461-39492462 rs3768324 %0A'
                    'rs75982468 %0D'
                    'chr10 5894499 %09 5894500 rs10905307 %0A%0D'
                    'This is an invalid region query %0D%0A')
    res = testapp.get(summary_query_url.format(region_query))
    expected_notes = {
        "This is an invalid region query ": "Failed: invalid region input"
    }
    assert res.json['notifications'] == expected_notes


