import argparse
import json
import logging
from pkg_resources import resource_filename
import sys

from pyramid.paster import get_app

from ..regulome_search import (
    get_coordinate,
    region_get_hits,
    evidence_to_features
)
from ..regulome_atlas import RegulomeAtlas
from snovault.elasticsearch.interfaces import SNP_SEARCH_ES

log = logging.getLogger(__name__)


def run(app, region_queries, assembly='GRCh37', return_peaks=False):
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format='[%(asctime)s] %(name)s:%(levelname)s: %(message)s',
    )

    atlas = RegulomeAtlas(app.registry[SNP_SEARCH_ES])
    results = []
    for region_query in region_queries:
        # Get coordinate for queried region
        try:
            chrom, start, end = get_coordinate(region_query, assembly, atlas)
        except ValueError:
            logging.error('Invalid input: {}'.format(region_query))
            continue
        try:
            all_hits = region_get_hits(atlas, assembly, chrom, start, end)
            evidence = atlas.regulome_evidence(all_hits['datasets'], chrom, int(start), int(end))
            regulome_score = atlas.regulome_score(all_hits['datasets'],
                                                  evidence)
            features = evidence_to_features(evidence)
        except Exception:
            logging.error(
                'Regulome search failed on {}:{}-{}'.format(chrom, start, end)
            )
            continue
        results.append(
            {
                'chrom': chrom,
                'start': start,
                'end': end,
                'score': regulome_score,
                'features': features,
            }
        )
    logging.info('Results:\n%s', json.dumps(results, indent=4, sort_keys=True))


def main():
    parser = argparse.ArgumentParser(
        description='Regulome search for one or more variations.'
    )
    # sudo -u encoded bin/regulome-search -s rs3768324 chr1:39492462-39492463
    production_config = resource_filename('encoded', '../../production.ini')
    parser.add_argument(
        '--config-file',
        help='Path to config file',
        default=production_config
    )
    parser.add_argument(
        '--app-name', help="Pyramid app name in configfile", default='app'
    )
    parser.add_argument(
        '--assembly',
        help="Select 'GRCh37' or 'GRCh38'. Default: 'GRCh37'.",
        choices=['GRCh37', 'GRCh38'],
        default='GRCh37'
    )
    parser.add_argument(
        '--peaks',
        help="Return peaks. By default, only scores will be return.",
        action='store_true',
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '-s', '--variants',
        nargs='+',
        help='One or more variants. Two formats can be accepted: 1) RefSNP ID '
        'such as rs3768324; 2) Genome coordinates in the format like: '
        'chr1:39492462-39492463.'
    )
    group.add_argument(
        '-f', '--file-input',
        help='One file with variants to be searched. Each row will be '
        'interpreted as one region. It can be a dbSNP ID, a BED format region '
        'or a region like chr1:39492462-39492463.'
    )
    args = parser.parse_args()
    variants = []
    if args.file_input:
        with open(args.file_input) as f:
            variants = f.readlines()
    elif args.variants:
        variants = args.variants
    return run(
        get_app(args.config_file, args.app_name),
        variants,
        args.assembly,
        args.peaks
    )


if __name__ == '__main__':
    main()
