import argparse
import io
from multiprocessing import Pool
from pkg_resources import resource_filename
import sys

import pyBigWig
from pyramid.paster import get_app

from ..regulome_search import (
    get_coordinate,
    region_get_hits,
    evidence_to_features
)
from ..regulome_atlas import RegulomeAtlas
from snovault.elasticsearch.interfaces import SNP_SEARCH_ES


class RegulomeSearch:
    """Start an independent app to do regulome search.
    """

    def __init__(
        self,
        config_file,
        app_name,
        assembly,
        return_peaks,
        matched_pwm_peak_bed_only
    ):
        self.config_file = config_file
        self.app_name = app_name
        self.assembly = assembly
        self.return_peaks = return_peaks
        self.matched_pwm_peak_bed_only = matched_pwm_peak_bed_only

    @property
    def atlas(self):
        try:
            return self._atlas
        except AttributeError:
            app = get_app(self.config_file, self.app_name)
            # So that different process won't compete for one bigWig handle
            instance_specific_bws = {
                'IC_matched_max': pyBigWig.open(
                    resource_filename(
                        'encoded', '../../bigwig_files/IC_matched_max.bw'
                    )
                ),
                'IC_max': pyBigWig.open(
                    resource_filename(
                        'encoded', '../../bigwig_files/IC_max.bw'
                    )
                ),
            }
            self._atlas = RegulomeAtlas(
                app.registry[SNP_SEARCH_ES],
                bw_signal_map=instance_specific_bws,
            )
            return self._atlas

    def __call__(self, region_query):
        # Get coordinate for queried region
        region_query = region_query.strip().split('\t')[3]
        try:
            chrom, start, end = get_coordinate(
                region_query, self.assembly, self.atlas
            )
        except ValueError:
            return 1, 'Invalid input: {}'.format(region_query)
        result = {
            'chrom': chrom,
            'start': start,
            'end': end,
        }
        try:
            all_hits = region_get_hits(
                self.atlas,
                self.assembly,
                chrom,
                start,
                end,
                peaks_too=self.return_peaks or self.matched_pwm_peak_bed_only
            )
            evidence = self.atlas.regulome_evidence(
                all_hits['datasets'], chrom, int(start), int(end)
            )
            if not self.matched_pwm_peak_bed_only:
                result['score'] = self.atlas.regulome_score(
                    all_hits['datasets'], evidence
                )
                result['features'] = evidence_to_features(evidence)
        except Exception:
            return 1, 'Regulome search failed on {}:{}-{}'.format(
                chrom, start, end
            )
        output_template = (
            '{chrom}\t'
            '{start}\t'
            '{end}\t'
            '{rsid}\t'
            '{ChIP}\t'
            '{DNase}\t'
            '{PWM}\t'
            '{Footprint}\t'
            '{QTL}\t'
            '{IC_max}\t'
            '{PWM_matched}\t'
            '{Footprint_matched}\t'
            '{IC_matched_max}\t'
            '{ranking}\t'
            '{probability}'
        )
        result.update(result['features'])
        result.update(result['score'])
        return 0, output_template.format(rsid=region_query, **result)


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
    parser.add_argument(
        '-p', '--processes',
        type=int,
        default=1,
        help='Number of process run in parallel.'
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

    if args.file_input:
        with open(args.file_input) as f:
            count = 0
            for count, _ in enumerate(f, 1):
                pass
        chunksize = count // args.processes + (count % args.processes > 0)
        variants_stream = open(args.file_input)
    elif args.variants:
        chunksize = len(args.variants) // args.processes + (
            len(args.variants) % args.processes > 0
        )
        variants_stream = io.StringIO('\n'.join(args.variants))

    success_count = 0
    failure_count = 0
    with variants_stream as variants:
        with Pool(args.processes) as p:
            for status, res in p.imap(
                RegulomeSearch(
                    args.config_file,
                    args.app_name,
                    args.assembly,
                    args.peaks,
                    args.matched_pwm_peak_only
                ),
                variants,
                chunksize
            ):
                if status == 0:
                    print(res)
                    success_count += 1
                else:
                    print(res, file=sys.stderr)
                    failure_count += 1
    print(
        'Succeeded {}; Failed: {}'.format(success_count, failure_count),
        file=sys.stderr
    )


if __name__ == '__main__':
    main()
