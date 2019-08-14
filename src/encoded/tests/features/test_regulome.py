""" Test Regulome functions
    * Region/Regulome indexing
    * Regulome scoring
"""

import pytest

pytestmark = [pytest.mark.indexing]


def test_one_regulome(testapp, workbook, region_index):
    res = testapp.get('/regulome-search/?region=rs3768324&genome=GRCh37')
    assert res.json['title'] == 'Regulome search'
    assert res.json['@type'] == ['region-search', 'Portal']
    assert res.json['notification'] == 'Success: 8 peaks in 8 files belonging to 8 datasets in this region'
    assert res.json['regulome_score'] == {'probability': '0.94', 'ranking': '1a'}
    assert res.json['coordinates'] == 'chr1:39492461-39492462'
    assert {e['accession'] for e in res.json['@graph']} == {
        'ENCSR228TST', 'ENCSR061TST', 'ENCSR000DCE', 'ENCSR333TST',
        'ENCSR899TST', 'ENCSR000ENO', 'ENCSR000EVI', 'ENCSR497SKR'
    }
    expected = [
        'http://localhost/regulome_download/regulome_evidence_hg19_chr1_39492461_39492462.bed',
        'http://localhost/regulome_download/regulome_evidence_hg19_chr1_39492461_39492462.json'
    ]
    assert res.json['download_elements'] == expected


def test_dataset_size(testapp, workbook, region_index):
    ''' this doesn't actually test size but makes sure some properties were removed '''
    res = testapp.get('/regulome-search/?region=rs10905307&genome=GRCh37')
    assert res.json['notification'] == 'Success: 3 peaks in 3 files belonging to 3 datasets in this region'
    assert res.json['regulome_score'] == {'probability': '0.2', 'ranking': '1f'}
    assert res.json['coordinates'] == 'chr10:5894499-5894500'
    assert {e['accession'] for e in res.json['@graph']} == {'ENCSR061TST', 'ENCSR000DZQ', 'ENCSR497SKR'}
    assert {e['biosample_ontology']['term_name'] for e in res.json['@graph']} == {'GM12878', 'lymphoblastoid cell line', 'HeLa-S3'}
    assert 'files' not in [res.json['@graph'][0].keys()]
    assert {e.get('assay_title', '') or e.get('annotation_type', '') for e in res.json['@graph']} == {'dsQTLs', 'ChIP-seq', 'chromatin state'}


def test_regulome_score(testapp, workbook, region_index):
    res = testapp.get('/regulome-search/?region=rs3768324&genome=GRCh37')
    assert res.json['regulome_score'] == {'probability': '0.94', 'ranking': '1a'}


def test_regulome_summary(testapp, workbook, region_index):
    summary_query_url = 'http://0.0.0.0:6543/regulome-summary/?regions={}&genome=GRCh37'

    region_query = ('%23This is a comment line %0A'
                    'chr1:39492461-39492462 rs3768324 %0A'
                    'rs75982468 %0D'
                    'chr10 5894499 %09 5894500 rs10905307 %0A%0D'
                    'This is an invalid region query %0D%0A')
    res = testapp.get(summary_query_url.format(region_query))
    import json
    print(json.dumps(res.json, indent=4, sort_keys=True))
    res_notes = sorted(res.json['notifications'], key=lambda x: next(iter(x)))
    expected_notes = [
        {"This is an invalid region query ": "Failed: invalid region input"},
        {"chr10:11741180-11741181": "Success"},
        {"chr10:5894499-5894500": "Success"},
        {"chr1:39492461-39492462": "Success"},
    ]
    assert res_notes == expected_notes


@pytest.mark.parametrize("query_term,expected,valid", [
    ('chrx:5894499-5894500', ('chrX', 5894499, 5894500), True),
    ('chr10:5894499-5894500extra string ', ('chr10', 5894499, 5894500), True),
    ('chr10 5894499\t5894500\trs10905307', ('chr10', 5894499, 5894500), True),
    ('rs10905307\textra string', ('chr10', 5894499, 5894500), True),
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
