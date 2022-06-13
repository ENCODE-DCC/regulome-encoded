import React from 'react';
import PropTypes from 'prop-types';

const NearbySNPsDrawing = (props) => {
    const context = props.context;

    let startNearbySnps = 0;
    let endNearbySnps = 0;
    let coordinate = 0;
    let coordinateX = 0;

    const coordinateXEven = [-100];
    const coordinateXOdd = [-100];
    const coordinateYOffset = [];
    let countEven = 0;
    let countOdd = 0;
    if (context.nearby_snps && context.nearby_snps[0] && context.nearby_snps[0].coordinates) {
        startNearbySnps = +context.nearby_snps[0].coordinates.lt;
        endNearbySnps = +context.nearby_snps[context.nearby_snps.length - 1].coordinates.lt;
        coordinate = +context.query_coordinates[0].split('-')[1];
        coordinateX = (920 * ((coordinate - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;

        context.nearby_snps.forEach((snp, snpIndex) => {
            let offset = 0;
            const tempCoordinate = (920 * ((+snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
            if (snpIndex % 2 === 0) {
                countEven += 1;
                coordinateXEven[countEven] = tempCoordinate;
                // check if coordinate was close to last even coordinate
                if ((coordinateXEven[countEven] - coordinateXEven[countEven - 1]) < 90) {
                    // check if last coordinate was also offset
                    if (coordinateYOffset[snpIndex - 2] !== 0) {
                        // if last coordinate was also offset, check if this coordinate was also too close to that one
                        if (coordinateXEven[countEven] - coordinateXEven[countEven - 1] < 90) {
                            offset = coordinateYOffset[snpIndex - 2] + 20;
                        } else {
                            offset = 20;
                        }
                    } else {
                        offset = 20;
                    }
                }
            } else {
                countOdd += 1;
                coordinateXOdd[countOdd] = tempCoordinate;
                // check if coordinate was close to last odd coordinate
                if ((coordinateXOdd[countOdd] - coordinateXOdd[countOdd - 1]) < 90) {
                    // check if last coordinate was also offset
                    if (coordinateYOffset[snpIndex - 2] !== 0) {
                        // if last coordinate was also offset, check if this coordinate was also too close to that one
                        if (coordinateXOdd[countOdd] - coordinateXOdd[countOdd - 1] < 90) {
                            offset = coordinateYOffset[snpIndex - 2] + 20;
                        } else {
                            offset = 20;
                        }
                    } else {
                        offset = 20;
                    }
                }
            }
            coordinateYOffset.push(offset);
        });
    }

    return (
        <div className="svg-container">
            <div className="svg-title top-title">Chromosome {context.nearby_snps[0].chrom.split('chr')[1]}</div>
            <div className="svg-title">SNPs matching searched coordinates and nearby SNPs</div>
            <svg className="nearby-snps" viewBox="0 -30 1000 220" preserveAspectRatio="xMidYMid meet" aria-labelledby="diagram-of-nearby-snps" role="img">
                <title id="diagram-of-nearby-snps">Diagram of nearby SNPs</title>
                <defs>
                    <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="5"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
                <g className="grid x-grid" id="xGrid">
                    <line x1="10" x2="990" y1="75" y2="75" markerEnd="url(#arrow)" markerStart="url(#arrow)" stroke="#7F7F7F" strokeWidth="2" />
                </g>
                <g className="labels x-labels">
                    {context.nearby_snps.map((snp, snpIndex) => {
                        const snpX = (920 * ((+snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
                        if (snpIndex % 2 === 0) {
                            if (snpX === coordinateX) {
                                return (
                                    <g key={`tick${snpIndex}`}>
                                        <line x1={String(snpX)} x2={String(snpX)} y1={60 - coordinateYOffset[snpIndex]} y2="75" stroke="#c13b42" strokeWidth="2" />
                                    </g>
                                );
                            }
                            return (
                                <g key={`tick${snpIndex}`}>
                                    <line x1={String(snpX)} x2={String(snpX)} y1={60 - coordinateYOffset[snpIndex]} y2="75" stroke="#7F7F7F" strokeWidth="2" />
                                </g>
                            );
                        }
                        if (snpX === coordinateX) {
                            return (
                                <g key={`tick${snpIndex}`}>
                                    <line x1={String(snpX)} x2={String(snpX)} y1={90 + coordinateYOffset[snpIndex]} y2="75" stroke="#c13b42" strokeWidth="2" />
                                </g>
                            );
                        }
                        return (
                            <g key={`tick${snpIndex}`}>
                                <line x1={String(snpX)} x2={String(snpX)} y1={90 + coordinateYOffset[snpIndex]} y2="75" stroke="#7F7F7F" strokeWidth="2" />
                            </g>
                        );
                    })}
                    {context.nearby_snps.map((snp, snpIndex) => {
                        const snpX = (920 * ((snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
                        const labelX = snpX - 40;
                        const labelWidth = snp.rsid.length * 9;
                        if (snpIndex % 2 === 0) {
                            if (snpX === coordinateX) {
                                return (
                                    <g key={`snp${snpIndex}`}>
                                        <rect x={labelX - 8} y={42 - coordinateYOffset[snpIndex]} height="18" width={labelWidth} fill="#c13b42" opacity="1.0" rx="2px" />
                                        <text x={labelX} y={55 - coordinateYOffset[snpIndex]} className="bold-label">{snp.rsid}</text>
                                    </g>
                                );
                            }
                            return (
                                <g key={`snp${snpIndex}`}>
                                    <rect x={labelX - 8} y={43 - coordinateYOffset[snpIndex]} height="15" width={labelWidth} fill="white" opacity="0.6" />
                                    <text x={labelX} y={55 - coordinateYOffset[snpIndex]}>{snp.rsid}</text>
                                </g>
                            );
                        }
                        if (snpX === coordinateX) {
                            return (
                                <g key={`snp${snpIndex}`}>
                                    <rect x={labelX - 8} y={87 + coordinateYOffset[snpIndex]} height="22" width={labelWidth} fill="#c13b42" opacity="1.0" />
                                    <text x={labelX} y={105 + coordinateYOffset[snpIndex]} className="bold-label">{snp.rsid}</text>
                                </g>
                            );
                        }
                        return (
                            <g key={`snp${snpIndex}`}>
                                <rect x={labelX - 8} y={89 + coordinateYOffset[snpIndex]} height="20" width={labelWidth} fill="white" opacity="0.6" />
                                <text x={labelX} y={105 + coordinateYOffset[snpIndex]}>{snp.rsid}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

NearbySNPsDrawing.propTypes = {
    context: PropTypes.object.isRequired,
};

export default NearbySNPsDrawing;
