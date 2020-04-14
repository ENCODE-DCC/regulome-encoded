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


def run(
    app,
    region_queries,
    assembly='GRCh37',
    return_peaks=False,
    matched_pwm_peak_bed_only=False
):
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format='[%(asctime)s] %(name)s:%(levelname)s: %(message)s',
    )

    atlas = RegulomeAtlas(app.registry[SNP_SEARCH_ES])
    motif_columns = (
        '{chrom}\t'
        '{start}\t'
        '{end}\t'
        '{motif_name}\t'
        '{strand}\t'
        '{hit_motif_start}\t'
        '{hit_motif_end}\t'
        '{query}\t'
        '{query_start}\t'
        '{query_end}'
    )
    for region_query in region_queries:
        # Get coordinate for queried region
        region_query = region_query.strip()
        try:
            chrom, start, end = get_coordinate(region_query, assembly, atlas)
        except ValueError:
            logging.error('Invalid input: {}'.format(region_query))
            continue
        result = {
            'chrom': chrom,
            'start': start,
            'end': end,
        }
        try:
            all_hits = region_get_hits(
                atlas,
                assembly,
                chrom,
                start,
                end,
                peaks_too=return_peaks or matched_pwm_peak_bed_only
            )
            evidence = atlas.regulome_evidence(
                all_hits['datasets'], chrom, int(start), int(end)
            )
            if not matched_pwm_peak_bed_only:
                result['score'] = atlas.regulome_score(
                    all_hits['datasets'], evidence
                )
                result['features'] = evidence_to_features(evidence)
        except Exception:
            logging.error(
                'Regulome search failed on {}:{}-{}'.format(chrom, start, end)
            )
            continue
        if matched_pwm_peak_bed_only:
            if not evidence.get('PWM_matched', []):
                continue
            matched_pwm_dict = {}
            for motif in evidence.get('PWM', []):
                if set(evidence['PWM_matched']) & set(motif.get('target', [])):
                    matched_pwm_dict[motif['@id']] = [
                        alias.split(sep=':', maxsplit=1)[1]
                        for doc in motif['documents']
                        for alias in doc['aliases']
                    ]
            for peak in all_hits.get('peaks', []):
                dataset = peak['resident_detail']['dataset']
                if dataset['@id'] not in matched_pwm_dict:
                    continue
                motif_peak = {
                    'chrom': peak['_index'],
                    'start': peak['_source']['coordinates']['gte'],
                    'end': peak['_source']['coordinates']['lt'],
                    'motif_name': ','.join(matched_pwm_dict[dataset['@id']]),
                    'strand': peak['_source'].get('strand', '.'),
                    'query': region_query,
                    'query_start': start,
                    'query_end': end,
                }
                if motif_peak['strand'] == '-':
                    motif_peak['hit_motif_start'] = motif_peak['end'] - end
                    motif_peak['hit_motif_end'] = motif_peak['end'] - start
                else:
                    motif_peak['hit_motif_start'] = start - motif_peak['start']
                    motif_peak['hit_motif_end'] = end - motif_peak['start']
                print(motif_columns.format(**motif_peak))
            continue
        if return_peaks:
            result['peaks'] = []
            for peak in all_hits.get('peaks', []):
                method = peak['resident_detail']['dataset']['collection_type']
                if method in [
                    'FAIRE-seq',
                    'chromatin state',
                    'binding sites',
                    'curated SNVs'
                ]:
                    continue
                peak_info = {
                    'method': method,
                }
                if method in ['ChIP-seq', 'Footprints', 'PWMs']:
                    peak_info['targets'] = peak[
                        'resident_detail'
                    ]['dataset'].get('target', [])
                if method == 'PWMs':
                    peak_info.update({
                        'chrom': peak['_index'],
                        'start': peak['_source']['coordinates']['gte'],
                        'end': peak['_source']['coordinates']['lt'],
                        'strand': peak['_source'].get('strand'),
                        'document_aliases': [
                            alias
                            for doc in peak['resident_detail']['dataset'][
                                'documents'
                            ]
                            for alias in doc['aliases']
                        ],
                    })
                else:
                    peak_info['biosample_term_name'] = peak[
                        'resident_detail'
                    ]['dataset']['biosample_ontology']['term_name']
                result['peaks'].append(peak_info)
        if not matched_pwm_peak_bed_only:
            print(json.dumps(result))


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
    parser.add_argument(
        '--matched-pwm-peak-only',
        help="Return motif peak details in BED format.",
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
        args.peaks,
        args.matched_pwm_peak_only,
    )


if __name__ == '__main__':
    main()
