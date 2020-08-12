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
    (
        'hg19',
        ('chr10', 98094819, 98094820),
        {
            '5f921aa5-5758-4ead-846a-26af87e1a098-199':
                {
                    'dataset':
                        {
                            '@id': '/annotations/ENCSR061TST/',
                            'annotation_type': 'dsQTLs',
                            'collection_type': 'dsQTLs',
                            'biosample_term_name': 'lymphoblastoid cell line',
                            'biosample_ontology': {
                                '@id': '/biosample-types/cell_line_EFO_0005292/',
                                '@type': [
                                    'BiosampleType',
                                    'Item'
                                ],
                                'aliases': [],
                                'cell_slims': [
                                    'lymphoblast'
                                ],
                                'classification': 'cell line',
                                'dbxrefs': [],
                                'developmental_slims': [],
                                'name': 'cell_line_EFO_0005292',
                                'organ_slims': [],
                                'references': [],
                                'schema_version': '1',
                                'status': 'released',
                                'synonyms': [],
                                'system_slims': [],
                                'term_id': 'EFO:0005292',
                                'term_name': 'lymphoblastoid cell line',
                                'uuid': '83c0535d-11fb-443f-9326-bbf381a6e2aa'
                            },
                            'documents': [],
                            'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0',
                        },
                    'file':
                        {
                            '@id': '/files/ENCFF122TST/',
                            'assembly': 'hg19',
                            'uuid': '5f921aa5-5758-4ead-846a-26af87e1a098',
                        },
                },
            '5cb53884-bc79-4909-8c5f-1e1ee2019009-2366':
                {
                    'dataset':
                        {
                            '@id': '/experiments/ENCSR000ENO/',
                            'assay_term_name': 'DNase-seq',
                            'biosample_term_name': 'HeLa-S3',
                            'biosample_ontology': {
                                '@id': '/biosample-types/cell_line_EFO_0002791/',
                                '@type': [
                                    'BiosampleType',
                                    'Item'
                                ],
                                'aliases': [],
                                'cell_slims': [
                                    'cancer cell'
                                ],
                                'classification': 'cell line',
                                'dbxrefs': [],
                                'developmental_slims': [],
                                'name': 'cell_line_EFO_0002791',
                                'organ_slims': [
                                    'uterus'
                                ],
                                'references': [],
                                'schema_version': '1',
                                'status': 'released',
                                'synonyms': [],
                                'system_slims': [],
                                'term_id': 'EFO:0002791',
                                'term_name': 'HeLa-S3',
                                'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                            },
                            'collection_type': 'DNase-seq',
                            'documents': [],
                            'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'
                        },
                    'file':
                        {
                            '@id': '/files/ENCFF892YMX/',
                            'assembly': 'hg19',
                            'uuid': '5cb53884-bc79-4909-8c5f-1e1ee2019009'
                        }
                },
            '08c4c912-6713-4904-9a76-5593c560ae03-11229':
                {
                    'dataset':
                        {
                            '@id': '/annotations/ENCSR497SKR/',
                            'annotation_type': 'chromatin state',
                            'biosample_term_name': 'HeLa-S3',
                            'biosample_ontology': {
                                '@id': '/biosample-types/cell_line_EFO_0002791/',
                                '@type': [
                                    'BiosampleType',
                                    'Item'
                                ],
                                'aliases': [],
                                'cell_slims': [
                                    'cancer cell'
                                ],
                                'classification': 'cell line',
                                'dbxrefs': [],
                                'developmental_slims': [],
                                'name': 'cell_line_EFO_0002791',
                                'organ_slims': [
                                    'uterus'
                                ],
                                'references': [],
                                'schema_version': '1',
                                'status': 'released',
                                'synonyms': [],
                                'system_slims': [],
                                'term_id': 'EFO:0002791',
                                'term_name': 'HeLa-S3',
                                'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                            },
                            'collection_type': 'chromatin state',
                            'documents': [],
                            'uuid': '51911c72-7c18-454f-803b-35e8416a716f'
                        },
                    'file':
                        {
                            '@id': '/files/ENCFF943TST/',
                            'assembly': 'hg19',
                            'uuid': '08c4c912-6713-4904-9a76-5593c560ae03'
                        }
                },
        }
    ),
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
                'ChIP': [{
                    'biosample_term_name': 'HeLa-S3',
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'collection_type': 'ChIP-seq',
                    'documents': [],
                    '@id': '/experiments/ENCSR000EVI/',
                    'assay_term_name': 'ChIP-seq',
                    'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93',
                    'target': ['ELK4']
                }],
                'QTL': [
                    {
                        'biosample_ontology': {
                            '@id': '/biosample-types/cell_line_EFO_0005292/',
                            '@type': ['BiosampleType', 'Item'],
                            'aliases': [],
                            'cell_slims': ['lymphoblast'],
                            'classification': 'cell line',
                            'dbxrefs': [],
                            'developmental_slims': [],
                            'name': 'cell_line_EFO_0005292',
                            'organ_slims': [],
                            'references': [],
                            'schema_version': '1',
                            'status': 'released',
                            'synonyms': [],
                            'system_slims': [],
                            'term_id': 'EFO:0005292',
                            'term_name': 'lymphoblastoid cell line',
                            'uuid': '83c0535d-11fb-443f-9326-bbf381a6e2aa'
                        },
                        'biosample_term_name': 'lymphoblastoid cell line',
                        'collection_type': 'dsQTLs',
                        'documents': [],
                        '@id': '/annotations/ENCSR061TST/',
                        'annotation_type': 'dsQTLs',
                        'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'
                    },
                    {
                        'biosample_ontology': {
                            '@id': '/biosample-types/cell_line_EFO_0005292/',
                            '@type': ['BiosampleType', 'Item'],
                            'aliases': [],
                            'cell_slims': ['lymphoblast'],
                            'classification': 'cell line',
                            'dbxrefs': [],
                            'developmental_slims': [],
                            'name': 'cell_line_EFO_0005292',
                            'organ_slims': [],
                            'references': [],
                            'schema_version': '1',
                            'status': 'released',
                            'synonyms': [],
                            'system_slims': [],
                            'term_id': 'EFO:0005292',
                            'term_name': 'lymphoblastoid cell line',
                            'uuid': '83c0535d-11fb-443f-9326-bbf381a6e2aa'
                        },
                        'biosample_term_name': 'lymphoblastoid cell line',
                        'collection_type': 'eQTLs',
                        'documents': [],
                        '@id': '/annotations/ENCSR899TST/',
                        'annotation_type': 'eQTLs',
                        'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'
                    }
                ],
                'Footprint': [{
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'biosample_term_name': 'HeLa-S3',
                    'collection_type': 'Footprints',
                    '@id': '/annotations/ENCSR228TST/',
                    'annotation_type': 'Footprints',
                    'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4',
                    'target': ['ELK4'],
                    'documents': [{
                        '@id': '/documents/95d594c7-9d40-4cdf-91c8-d03f714a7305/',
                        '@type': ['Document', 'Item'],
                        'aliases': ['j-michael-cherry:regulomedb-PWMs-M01167.pwm'],
                        'attachment': {'download': 'M01167.txt',
                                       'href': '@@download/attachment/M01167.txt',
                                       'md5sum': '67ea4b72bf5cc72aa8f00bf3e55e313d',
                                       'type': 'text/plain'},
                        'award': '/awards/U41HG009293/',
                        'date_created': '2019-08-23T05:26:07.754121+00:00',
                        'document_type': 'position '
                                         'weight '
                                         'matrix',
                        'lab': '/labs/j-michael-cherry/',
                        'references': [],
                        'schema_version': '8',
                        'status': 'released',
                        'submitted_by': '/users/76091563-a959-4a9c-929c-9acfa1a0a078/',
                        'urls': [],
                        'uuid': '95d594c7-9d40-4cdf-91c8-d03f714a7305'
                    }],
                }],
                'DNase': [{
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'biosample_term_name': 'HeLa-S3',
                    'collection_type': 'DNase-seq',
                    'documents': [],
                    '@id': '/experiments/ENCSR000ENO/',
                    'assay_term_name': 'DNase-seq',
                    'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'
                }],
                'Footprint_matched': ['ELK4'],
                'PWM': [{
                    'biosample_term_name': 'None',
                    'biosample_ontology': {},
                    'collection_type': 'PWMs',
                    '@id': '/annotations/ENCSR333TST/',
                    'annotation_type': 'PWMs',
                    'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc',
                    'target': ['ELK4'],
                    'documents': [{
                        '@id': '/documents/87632efc-0349-4914-b74a-6fdd733e8146/',
                        '@type': ['Document', 'Item'],
                        'aliases': ['j-michael-cherry:regulomedb-PWMs-MA0076.1.pwm'],
                        'attachment': {'download': 'MA0076.1.txt',
                                       'href': '@@download/attachment/MA0076.1.txt',
                                       'md5sum': 'a3226204e49720d6858d1523fd3ae60a',
                                       'type': 'text/plain'},
                        'award': '/awards/U41HG009293/',
                        'date_created': '2019-08-23T05:26:07.786049+00:00',
                        'document_type': 'position weight '
                                        'matrix',
                        'lab': '/labs/j-michael-cherry/',
                        'references': [],
                        'schema_version': '8',
                        'status': 'released',
                        'submitted_by': '/users/76091563-a959-4a9c-929c-9acfa1a0a078/',
                        'urls': [],
                        'uuid': '87632efc-0349-4914-b74a-6fdd733e8146'
                    }],
                }],
                'PWM_matched': ['ELK4'],
                'IC_matched_max': 2.0,
                'IC_max': 2.0,
            },
            'ref_allele_freq': {
                'C': {
                    'ALSPAC': 0.6938,
                    'TWINSUK': 0.6982,
                    'PAGE_STUDY': 0.7644,
                    'NorthernSweden': 0.7433,
                    'Vietnamese': 0.715,
                    'TOPMED': 0.742,
                    'Estonian': 0.6978,
                    '1000Genomes': 0.759,
                    'GnomAD': 0.7411
                }
            },
            'alt_allele_freq': {
                'T': {
                    'ALSPAC': 0.3062,
                    'TWINSUK': 0.3018,
                    'PAGE_STUDY': 0.2356,
                    'NorthernSweden': 0.2567,
                    'Vietnamese': 0.285,
                    'TOPMED': 0.258,
                    'Estonian': 0.3022,
                    '1000Genomes': 0.241,
                    'GnomAD': 0.2589
                }
            },
            'maf': 0.3062,
            'coordinates': {'lt': 39492462, 'gte': 39492461},
            'score': {'probability': '0.99267', 'ranking': '1a'},
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 104551865, 50000,
        [
            {
                'evidence': {
                    'IC_matched_max': 0.44999998807907104,
                    'IC_max': 0.44999998807907104,
                },
                'ref_allele_freq': {
                    'A': {
                        'ALSPAC': 0.767,
                        'TWINSUK': 0.7621,
                        'PAGE_STUDY': 0.7646,
                        'NorthernSweden': 0.8433,
                        'Vietnamese': 0.743,
                        'TOPMED': 0.7585,
                        'Estonian': 0.8507,
                        '1000Genomes': 0.7482,
                        'GnomAD': 0.7862
                    }
                },
                'alt_allele_freq': {
                    'G': {
                        'ALSPAC': 0.233,
                        'TWINSUK': 0.2379,
                        'PAGE_STUDY': 0.2354,
                        'NorthernSweden': 0.1567,
                        'Vietnamese': 0.257,
                        'TOPMED': 0.2415,
                        'Estonian': 0.1493,
                        '1000Genomes': 0.2518,
                        'GnomAD': 0.2138
                    }
                },
                'maf': 0.257,
                'coordinates': {'lt': 104529668, 'gte': 104529667},
                'score': {'probability': '0.44299', 'ranking': '7'},
                'rsid': 'rs7092340',
                'assembly': 'hg19',
                'chrom': 'chr10'
            },
            {
                'evidence': {
                    'IC_matched_max': 0.1599999964237213,
                    'IC_max': 0.3700000047683716,
                },
                'ref_allele_freq': {
                    'G': {
                        'ALSPAC': 0.4118,
                        'TWINSUK': 0.3997,
                        'NorthernSweden': 0.3283,
                        'Vietnamese': 0.649,
                        'TOPMED': 0.442,
                        'Estonian': 0.479,
                        '1000Genomes': 0.4571,
                        'GnomAD': 0.4478
                    }
                },
                'alt_allele_freq': {
                    'C': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    },
                    'T': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    },
                    'A': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    }
                },
                'maf': 0.6717,
                'coordinates': {'lt': 104574063, 'gte': 104574062},
                'score': {'probability': '0.47065', 'ranking': '7'},
                'rsid': 'rs284857',
                'assembly': 'hg19',
                'chrom': 'chr10'
            },
        ])
])
def test_scored_snps(assembly, chrom, pos, window, result, region_index, regulome_atlas):
    max_snps = 10
    range_start = int(pos - (window / 2))
    range_end = int(pos + (window / 2))
    if range_start < 0:
        range_end += 0 - range_start
        range_start = 0

    scored_snps = regulome_atlas._scored_snps(assembly, chrom, range_start, range_end, max_snps, pos)
    count = 0
    for snp in scored_snps:
        count += 1
        # The following loop is a temporary patch for QTL evidence which has
        # both dsQTL and eQTL data returned in arbitrary order.
        for k in snp['evidence']:
            if (
                isinstance(snp['evidence'][k], list)
                and len(snp['evidence'][k]) > 1
                and all('uuid' in data for data in snp['evidence'][k])
            ):
                snp['evidence'][k] = sorted(
                    snp['evidence'][k], key=lambda x: x['uuid']
                )
        assert snp in result
    assert len(result) == count


@pytest.mark.parametrize("assembly,chrom,pos,window,result", [
    ('hg19', 'chr1', 39492462, 1600,
        [{
            'evidence': {
                'ChIP': [{
                    'biosample_term_name': 'HeLa-S3',
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'collection_type': 'ChIP-seq',
                    'documents': [],
                    '@id': '/experiments/ENCSR000EVI/',
                    'assay_term_name': 'ChIP-seq',
                    'uuid': '5d9a1769-5bdf-40af-85a9-d08c9a3c9b93',
                    'target': ['ELK4']
                }],
                'QTL': [
                    {
                        'biosample_ontology': {
                            '@id': '/biosample-types/cell_line_EFO_0005292/',
                            '@type': ['BiosampleType', 'Item'],
                            'aliases': [],
                            'cell_slims': ['lymphoblast'],
                            'classification': 'cell line',
                            'dbxrefs': [],
                            'developmental_slims': [],
                            'name': 'cell_line_EFO_0005292',
                            'organ_slims': [],
                            'references': [],
                            'schema_version': '1',
                            'status': 'released',
                            'synonyms': [],
                            'system_slims': [],
                            'term_id': 'EFO:0005292',
                            'term_name': 'lymphoblastoid cell line',
                            'uuid': '83c0535d-11fb-443f-9326-bbf381a6e2aa'
                        },
                        'biosample_term_name': 'lymphoblastoid cell line',
                        'collection_type': 'dsQTLs',
                        'documents': [],
                        '@id': '/annotations/ENCSR061TST/',
                        'annotation_type': 'dsQTLs',
                        'uuid': '4109b15f-8bf7-4711-b644-43032f5c27e0'
                    },
                    {
                        'biosample_ontology': {
                            '@id': '/biosample-types/cell_line_EFO_0005292/',
                            '@type': ['BiosampleType', 'Item'],
                            'aliases': [],
                            'cell_slims': ['lymphoblast'],
                            'classification': 'cell line',
                            'dbxrefs': [],
                            'developmental_slims': [],
                            'name': 'cell_line_EFO_0005292',
                            'organ_slims': [],
                            'references': [],
                            'schema_version': '1',
                            'status': 'released',
                            'synonyms': [],
                            'system_slims': [],
                            'term_id': 'EFO:0005292',
                            'term_name': 'lymphoblastoid cell line',
                            'uuid': '83c0535d-11fb-443f-9326-bbf381a6e2aa'
                        },
                        'biosample_term_name': 'lymphoblastoid cell line',
                        'collection_type': 'eQTLs',
                        'documents': [],
                        '@id': '/annotations/ENCSR899TST/',
                        'annotation_type': 'eQTLs',
                        'uuid': 'f10dba36-d3dd-455a-ae25-57239b7b9e27'
                    }
                ],
                'Footprint': [{
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'biosample_term_name': 'HeLa-S3',
                    'collection_type': 'Footprints',
                    '@id': '/annotations/ENCSR228TST/',
                    'annotation_type': 'Footprints',
                    'uuid': 'bfee7ca5-800e-4106-903d-825b9fe2faf4',
                    'target': ['ELK4'],
                    'documents': [{
                        '@id': '/documents/95d594c7-9d40-4cdf-91c8-d03f714a7305/',
                        '@type': ['Document', 'Item'],
                        'aliases': ['j-michael-cherry:regulomedb-PWMs-M01167.pwm'],
                        'attachment': {'download': 'M01167.txt',
                                       'href': '@@download/attachment/M01167.txt',
                                       'md5sum': '67ea4b72bf5cc72aa8f00bf3e55e313d',
                                       'type': 'text/plain'},
                        'award': '/awards/U41HG009293/',
                        'date_created': '2019-08-23T05:26:07.754121+00:00',
                        'document_type': 'position '
                                         'weight '
                                         'matrix',
                        'lab': '/labs/j-michael-cherry/',
                        'references': [],
                        'schema_version': '8',
                        'status': 'released',
                        'submitted_by': '/users/76091563-a959-4a9c-929c-9acfa1a0a078/',
                        'urls': [],
                        'uuid': '95d594c7-9d40-4cdf-91c8-d03f714a7305'
                    }],
                }],
                'DNase': [{
                    'biosample_ontology': {
                        '@id': '/biosample-types/cell_line_EFO_0002791/',
                        '@type': ['BiosampleType', 'Item'],
                        'aliases': [],
                        'cell_slims': ['cancer cell'],
                        'classification': 'cell line',
                        'dbxrefs': [],
                        'developmental_slims': [],
                        'name': 'cell_line_EFO_0002791',
                        'organ_slims': ['uterus'],
                        'references': [],
                        'schema_version': '1',
                        'status': 'released',
                        'synonyms': [],
                        'system_slims': [],
                        'term_id': 'EFO:0002791',
                        'term_name': 'HeLa-S3',
                        'uuid': '2ca8e02c-2c6e-4bcd-b361-668819050b93'
                    },
                    'biosample_term_name': 'HeLa-S3',
                    'collection_type': 'DNase-seq',
                    'documents': [],
                    '@id': '/experiments/ENCSR000ENO/',
                    'assay_term_name': 'DNase-seq',
                    'uuid': '7fabca98-92e3-4957-924e-520490d3d26b'
                }],
                'Footprint_matched': ['ELK4'],
                'PWM': [{
                    'biosample_term_name': 'None',
                    'biosample_ontology': {},
                    'collection_type': 'PWMs',
                    '@id': '/annotations/ENCSR333TST/',
                    'annotation_type': 'PWMs',
                    'uuid': '7fd82bc3-120e-4dda-9a9f-c2cd37c71afc',
                    'target': ['ELK4'],
                    'documents': [{
                        '@id': '/documents/87632efc-0349-4914-b74a-6fdd733e8146/',
                        '@type': ['Document', 'Item'],
                        'aliases': ['j-michael-cherry:regulomedb-PWMs-MA0076.1.pwm'],
                        'attachment': {'download': 'MA0076.1.txt',
                                       'href': '@@download/attachment/MA0076.1.txt',
                                       'md5sum': 'a3226204e49720d6858d1523fd3ae60a',
                                       'type': 'text/plain'},
                        'award': '/awards/U41HG009293/',
                        'date_created': '2019-08-23T05:26:07.786049+00:00',
                        'document_type': 'position weight '
                                        'matrix',
                        'lab': '/labs/j-michael-cherry/',
                        'references': [],
                        'schema_version': '8',
                        'status': 'released',
                        'submitted_by': '/users/76091563-a959-4a9c-929c-9acfa1a0a078/',
                        'urls': [],
                        'uuid': '87632efc-0349-4914-b74a-6fdd733e8146'
                    }],
                }],
                'PWM_matched': ['ELK4'],
                'IC_matched_max': 2.0,
                'IC_max': 2.0,
            },
            'ref_allele_freq': {
                'C': {
                    'ALSPAC': 0.6938,
                    'TWINSUK': 0.6982,
                    'PAGE_STUDY': 0.7644,
                    'NorthernSweden': 0.7433,
                    'Vietnamese': 0.715,
                    'TOPMED': 0.742,
                    'Estonian': 0.6978,
                    '1000Genomes': 0.759,
                    'GnomAD': 0.7411
                }
            },
            'alt_allele_freq': {
                'T': {
                    'ALSPAC': 0.3062,
                    'TWINSUK': 0.3018,
                    'PAGE_STUDY': 0.2356,
                    'NorthernSweden': 0.2567,
                    'Vietnamese': 0.285,
                    'TOPMED': 0.258,
                    'Estonian': 0.3022,
                    '1000Genomes': 0.241,
                    'GnomAD': 0.2589
                }
            },
            'maf': 0.3062,
            'coordinates': {'lt': 39492462, 'gte': 39492461},
            'score': {'probability': '0.99267', 'ranking': '1a'},
            'rsid': 'rs3768324',
            'assembly': 'hg19',
            'chrom': 'chr1'
        }]),
    ('hg19', 'chr10', 104551865, 50000,
        [
            {
                'evidence': {
                    'IC_matched_max': 0.44999998807907104,
                    'IC_max': 0.44999998807907104,
                },
                'ref_allele_freq': {
                    'A': {
                        'ALSPAC': 0.767,
                        'TWINSUK': 0.7621,
                        'PAGE_STUDY': 0.7646,
                        'NorthernSweden': 0.8433,
                        'Vietnamese': 0.743,
                        'TOPMED': 0.7585,
                        'Estonian': 0.8507,
                        '1000Genomes': 0.7482,
                        'GnomAD': 0.7862
                    }
                },
                'alt_allele_freq': {
                    'G': {
                        'ALSPAC': 0.233,
                        'TWINSUK': 0.2379,
                        'PAGE_STUDY': 0.2354,
                        'NorthernSweden': 0.1567,
                        'Vietnamese': 0.257,
                        'TOPMED': 0.2415,
                        'Estonian': 0.1493,
                        '1000Genomes': 0.2518,
                        'GnomAD': 0.2138
                    }
                },
                'maf': 0.257,
                'coordinates': {'lt': 104529668, 'gte': 104529667},
                'score': {'probability': '0.44299', 'ranking': '7'},
                'rsid': 'rs7092340',
                'assembly': 'hg19',
                'chrom': 'chr10'
            },
            {
                'evidence': {
                    'IC_matched_max': 0.1599999964237213,
                    'IC_max': 0.3700000047683716,
                },
                'ref_allele_freq': {
                    'G': {
                        'ALSPAC': 0.4118,
                        'TWINSUK': 0.3997,
                        'NorthernSweden': 0.3283,
                        'Vietnamese': 0.649,
                        'TOPMED': 0.442,
                        'Estonian': 0.479,
                        '1000Genomes': 0.4571,
                        'GnomAD': 0.4478
                    }
                },
                'alt_allele_freq': {
                    'C': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    },
                    'T': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    },
                    'A': {
                        'ALSPAC': 0.5882,
                        'TWINSUK': 0.6003,
                        'NorthernSweden': 0.6717,
                        'Vietnamese': 0.351,
                        'TOPMED': 0.558,
                        'Estonian': 0.521,
                        '1000Genomes': 0.5429,
                        'GnomAD': 0.5522
                    }
                },
                'maf': 0.6717,
                'coordinates': {'lt': 104574063, 'gte': 104574062},
                'score': {'probability': '0.47065', 'ranking': '7'},
                'rsid': 'rs284857',
                'assembly': 'hg19',
                'chrom': 'chr10'
            },
        ])
])
def test_nearby_snps_scored(assembly, chrom, pos, window, result, region_index, regulome_atlas):

    scored_snps = regulome_atlas.nearby_snps(assembly, chrom, pos, window=window, scores=True)
    count = 0
    for snp in scored_snps:
        count += 1
        # The following loop is a temporary patch for QTL evidence which has
        # both dsQTL and eQTL data returned in arbitrary order.
        for k in snp['evidence']:
            if (
                isinstance(snp['evidence'][k], list)
                and len(snp['evidence'][k]) > 1
                and all('uuid' in data for data in snp['evidence'][k])
            ):
                snp['evidence'][k] = sorted(
                    snp['evidence'][k], key=lambda x: x['uuid']
                )
        assert snp in result
    assert len(result) == count


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
