module.exports = {
    '@context': "/terms/",
    '@id': "/regulome-summary/?regions=rs3768324%0D%0Ars75982468%0D%0Ars10905307%0D%0Ars10823321%0D%0Ars7745856&genome=GRCh37&maf=0.01",
    '@type': [
        "regulome-summary"
    ],
    assembly: "GRCh37",
    format: "json",
    from: 0,
    notifications: { },
    query_coordinates: [
        "chr1:39492461-39492462",
        "chr10:11741180-11741181",
        "chr10:5894499-5894500",
        "chr10:70989269-70989270",
        "chr6:10695157-10695158"
    ],
    title: "RegulomeDB Summary",
    total: 2,
    variants: [
        {
            chrom: "chr1",
            end: 39492462,
            features: {
                ChIP: true,
                DNase: true,
                Footprint: true,
                Footprint_matched: true,
                IC_matched_max: 2,
                IC_max: 2,
                PWM: true,
                PWM_matched: true,
                QTL: true
            },
            regulome_score: {
                probability: "0.99267",
                ranking: "1a"
            },
            rsids: [
                "rs3768324"
            ],
            start: 39492461
        },
        {
            chrom: "chr10",
            end: 5894500,
            features: {
                ChIP: true,
                DNase: true,
                Footprint: true,
                Footprint_matched: true,
                IC_matched_max: 0.05000000074505806,
                IC_max: 1.3899999856948853,
                PWM: true,
                PWM_matched: true,
                QTL: true
            },
            regulome_score: {
                probability: "0.9",
                ranking: "1a"
            },
            rsids: [
                "rs10905307"
            ],
            start: 5894499
        },
    ]
}
