# http://redmine.encodedcc.org/issues/4987

label_mapping = {
    'ali-mortazavi:microRNA-alignment-v1': 'microrna-seq-alignment-step',
    'ali-mortazavi:microrna-quantification-step': 'microrna-quantification-step',
    'ali-mortazavi:microrna-signal-step-v1': 'microrna-signal-step',
    'ali-mortazavi:nanostring-bigbed-step-v-1': 'nanostring-bigbed-step',
    'ali-mortazavi:nsolver-step': 'nanostring-nsolver-step',
    'anshul-kundaje:atac-seq-annotation-qc-step-single-replicate-v1': 'kundaje-lab-atac-seq-qc-single-rep-step',
    'anshul-kundaje:atac-seq-annotation-qc-step-v1': 'kundaje-lab-atac-seq-qc-step',
    'anshul-kundaje:atac-seq-filtered-peaks-to-bigbed-step-single-rep-v1': 'kundaje-lab-atac-seq-filtered-peaks-conversion-single-rep-step',
    'anshul-kundaje:atac-seq-filtered-peaks-to-bigbed-step-v1': 'kundaje-lab-atac-seq-filtered-peaks-conversion-step',
    'anshul-kundaje:atac-seq-idr-peaks-to-bigbed-step-v1': 'kundaje-lab-atac-seq-idr-peaks-conversion-step',
    'anshul-kundaje:atac-seq-idr-step-v1': 'kundaje-lab-atac-seq-idr-step',
    'anshul-kundaje:atac-seq-overlap-step-single-rep-v1': 'kundaje-lab-atac-seq-overlap-peaks-single-rep-step',
    'anshul-kundaje:atac-seq-overlap-step-v1': 'kundaje-lab-atac-seq-overlap-peaks-step',
    'anshul-kundaje:atac-seq-peaks-filter-step-single-rep-v1': 'kundaje-lab-atac-seq-peak-call-single-rep-step',
    'anshul-kundaje:atac-seq-peaks-filter-step-v1': 'kundaje-lab-atac-seq-peak-call-step',
    'anshul-kundaje:atac-seq-pseudoreplicated-idr-peaks-to-bigbed-step-single-rep-v1': 'kundaje-lab-atac-seq-pseudoreplicated-idr-peaks-conversion-single-rep-step',
    'anshul-kundaje:atac-seq-replicated-peaks-to-bigbed-step-v1': 'kundaje-lab-atac-seq-replicated-peaks-conversion-step',
    'anshul-kundaje:atac-seq-signal-generation-step-single-rep-v1': 'kundaje-lab-atac-seq-signals-single-rep-step',
    'anshul-kundaje:atac-seq-signal-generation-step-v1': 'kundaje-lab-atac-seq-signals-step',
    'anshul-kundaje:atac-seq-stable-peaks-to-bigbed-step-single-rep-v1': 'kundaje-lab-atac-seq-stable-peaks-conversion-single-rep-step',
    'anshul-kundaje:atac-seq-trim-align-filter-step-single-rep-v1': 'kundaje-lab-atac-seq-trim-align-filter-single-rep-step',
    'anshul-kundaje:atac-seq-trim-align-filter-step-v1': 'kundaje-lab-atac-seq-trim-align-filter-step',
    'anshul-kundaje:atac-seq-unreplicated-idr-step-single-rep-v1': 'kundaje-lab-atac-seq-unreplicated-idr-single-rep-step',
    'christina-leslie:atac_seq_bam_to_bed': 'ggr-cl1-atac-seq-bam-to-bed-step',
    'christina-leslie:atac_seq_fastq_to_bam': 'ggr-cl1-atac-seq-mapping-step',
    'christina-leslie:atac_seq_idr_and_blacklist_filter': 'ggr-cl1-atac-seq-idr-step',
    'christina-leslie:chip_seq_bam_quantification': 'ggr-cl1-chip-seq-quantification-step',
    'christina-leslie:chip_seq_fastq_to_bam': 'ggr-cl1-chip-seq-mapping-step',
    'christina-leslie:rna_seq_bam_to_counts': 'ggr-cl1-rna-seq-quantification-step',
    'christina-leslie:rna_seq_fastq_to_bam': 'ggr-cl1-rna-seq-trimming-mapping-filtering-step',
    'dnanexus:align-star-pe-v-1': 'lrna-pe-star-alignment-step',
    'dnanexus:align-star-se-v-1': 'lrna-se-star-alignment-step',
    'dnanexus:align-star-se-v-2': 'deleted-lrna-se-star-alignment-step',
    'dnanexus:align-tophat-pe-v-1': 'lrna-pe-tophat-alignment-step',
    'dnanexus:align-tophat-se-v-1': 'lrna-se-tophat-alignment-step',
    'dnanexus:bam-to-bigwig-pe-tophat-v-1': 'lrna-pe-star-signals-for-tophat-step',
    'dnanexus:bam-to-bigwig-pe-v-1': 'lrna-pe-star-signal-step',
    'dnanexus:bam-to-bigwig-se-tophat-v-1': 'lrna-se-star-signals-for-tophat-step',
    'dnanexus:bam-to-bigwig-se-v-1': 'lrna-se-star-signal-step',
    'dnanexus:bigbed-conversion-v-2.6': 'wgbs-methylation-to-bigbed-conversion-step',
    'dnanexus:dme-align-pe-v-1': 'dme-align-pe-step',
    'dnanexus:dme-align-se': 'deleted-dme-align-se-step',
    'dnanexus:dme-extract-pe-v-2': 'dme-extract-pe-step',
    'dnanexus:dme-extract-se-v-2': 'dme-extract-se-step',
    'dnanexus:dme-index-bismark-bowtie2-v-2': 'dme-index-bismark-bowtie2-step',
    'dnanexus:dme-rep-corr-alt-v-1': 'dme-rep-corr-se-step',
    'dnanexus:dme-rep-corr-v-1': 'dme-rep-corr-pe-step',
    'dnanexus:dnase-align-bwa-pe-v-1': 'dnase-align-bwa-pe-step',
    'dnanexus:dnase-align-bwa-se-v-1': 'dnase-align-bwa-se-step',
    'dnanexus:dnase-call-hotspots-alt-v-1': 'dnase-call-hotspots-se-step',
    'dnanexus:dnase-call-hotspots-v-1': 'dnase-call-hotspots-pe-step',
    'dnanexus:dnase-eval-bam-alt-v-1': 'dnase-eval-bam-se-step',
    'dnanexus:dnase-eval-bam-v-1': 'dnase-eval-bam-pe-step',
    'dnanexus:dnase-filter-pe-v-1': 'dnase-filter-pe-step',
    'dnanexus:dnase-filter-se-v-1': 'dnase-filter-se-step',
    'dnanexus:dnase-index-bwa-v-1': 'dnase-index-bwa-step',
    'dnanexus:dnase-rep-corr-alt-v-1': 'dnase-rep-corr-se-step',
    'dnanexus:dnase-rep-corr-v-1': 'dnase-rep-corr-pe-step',
    'dnanexus:mad-qc-alt-v-1': 'lrna-repcorr-qc-se-step',
    'dnanexus:mad-qc-v-1': 'lrna-repcorr-qc-pe-step',
    'dnanexus:prep-rsem-v-1': 'lrna-index-rsem-step',
    'dnanexus:prep-star-v-1': 'lrna-index-star-step',
    'dnanexus:prep-tophat-v-1': 'lrna-index-tophat-step',
    'dnanexus:quant-rsem-alt-v-1': 'lrna-se-rsem-quantification-step',
    'dnanexus:quant-rsem-v-1': 'lrna-pe-rsem-quantification-step',
    'dnanexus:rampage-align-pe-v-1': 'rampage-pe-alignment-step',
    'dnanexus:rampage-idr-v-1': 'rampage-idr-step',
    'dnanexus:rampage-mad-qc-v-1': 'rampage-repcorr-qc-step',
    'dnanexus:rampage-peaks-v-2': 'rampage-grit-peak-calling-step',
    'dnanexus:rampage-signals-v-1': 'rampage-star-signal-step',
    'dnanexus:small-rna-align-v-2': 'small-rna-se-star-alignment-step',
    'dnanexus:small-rna-mad-qc-v-1': 'small-rna-repcorr-qc-step',
    'dnanexus:small-rna-prep-star-v-2': 'small-rna-star-indexing-step',
    'dnanexus:small-rna-signals-v-1': 'small-rna-star-stranded-signal-step',
    'encode:alignment-pooling-step': 'alignment-pooling-step',
    'encode:bwa-alignment-step-v-1': 'bwa-alignment-step',
    'encode:bwa-indexing-step-v-1': 'bwa-indexing-step',
    'encode:bwa-raw-alignment-step-v-1': 'bwa-raw-alignment-step',
    'encode:frip_seq_pipeline_v1_alignmnet_step': 'broad-frip-seq-fastq-alignment-step',
    'encode:frip_seq_pipeline_v1_cuffdiff_step': 'broad-frip-seq-cuffdiff-step',
    'encode:histone-overlap-peaks-step-v-1': 'histone-overlap-peaks-step',
    'encode:histone-peak-calling-step-v-1': 'histone-peak-calling-step',
    'encode:histone-peaks-to-bigbed-step-v-1': 'histone-peaks-to-bigbed-step',
    'encode:histone-replicated-peaks-to-bigbed-step-v-1': 'histone-replicated-peaks-to-bigbed-step',
    'encode:histone-unreplicated-partition-concordance-peaks-to-bigbed-step-v-1': 'histone-unreplicated-partition-concordance-peaks-to-bigbed-step',
    'encode:histone-unreplicated-partition-concordance-step-v-1': 'histone-unreplicated-partition-concordance-step',
    'encode:histone-unreplicated-peak-calling-step-v-1': 'histone-unreplicated-peak-calling-step',
    'encode:histone-unreplicated-peaks-to-bigbed-step-v-1': 'histone-unreplicated-peaks-to-bigbed-step',
    'encode:mango-step0-index-bowtie': 'mango-index-bowtie-step',
    'encode:mango-step1-trim-linkers': 'mango-trim-linkers-step',
    'encode:mango-step2-align-bowtie': 'mango-align-bowtie-step',
    'encode:mango-step3-signal-generation': 'mango-make-signal-step',
    'encode:mango-step4-macs2-call-peaks': 'mango-macs2-call-peaks-step',
    'encode:mango-step5-calc-interaction-confidence': 'mango-calc-interaction-confidence-step',
    'encode:tf-idr-peaks-to-bigbed-step-v-1': 'tf-idr-peaks-to-bigbed-step',
    'encode:tf-idr-step-v-1': 'tf-idr-step',
    'encode:tf-macs2-signal-calling-step-v-1': 'tf-macs2-signal-calling-step',
    'encode:tf-peaks-to-bigbed-step-v-1': 'tf-peaks-to-bigbed-step',
    'encode:tf-spp-peak-calling-step-v-1': 'tf-spp-peak-calling-step',
    'encode:tf-unreplicated-idr-peaks-to-bigbed-step-v-1': 'tf-unreplicated-idr-peaks-to-bigbed-step',
    'encode:tf-unreplicated-idr-step-v-1': 'tf-unreplicated-idr-step',
    'encode:tf-unreplicated-macs2-signal-calling-step-v-1': 'tf-unreplicated-macs2-signal-calling-step',
    'encode:tf-unreplicated-peaks-to-bigbed-step-v-1': 'tf-unreplicated-peaks-to-bigbed-step',
    'encode:tf-unreplicated-spp-peak-calling-step-v-1': 'tf-unreplicated-spp-peak-calling-step',
    'encode:wgbs-bismark-alignment-step-v-1': 'dme-align-se-step',
    'dnanexus:dme-align-se-v-1': 'dme-align-se-step',
    'encode:wgbs-bismark-indexing-step-v-1': 'dme-index-bismark-bowtie1-step',
    'dnanexus:dme-index-bismark-v-2': 'dme-index-bismark-bowtie1-step',
    'encode:wgbs-bismark-quantification-step-v-1': 'wgbs-bismark-quantification-step',
    'gene-yeo:eclip_bed_to_bigbed': 'eclip-bigbed-to-bed-step',
    'gene-yeo:eclip_fastq_to_bam': 'eclip-trimming-mapping-step',
    'gene-yeo:eclip_signal_normal': 'eclip-normalization-step',
    'j-michael-cherry:08fd0a3a-9d4f-483c-9316-e382da277344': 'control-alignment-subsampling-step',
    'j-michael-cherry:1ede083b-9220-4ee3-aca4-bf691f70e23e': 'shrna-rna-seq-signal-step',
    'j-michael-cherry:208715a1-1998-4191-9f00-16378333ccb1': 'dnase-bed-to-bigbed-step',
    'j-michael-cherry:22dee925-30d9-4b01-ba3c-ea5cbfb15c98': 'deleted-lrna-pe-star-stranded-signals-for-tophat-step',
    'j-michael-cherry:33c5bca6-5338-45b9-b837-04441d4b582c': 'alignment-subsampling-step',
    'j-michael-cherry:359d63f3-8e92-4731-a719-58fb7053bdb9': 'deleted-lrna-index-star-step',
    'j-michael-cherry:3fa67405-fa88-4627-b3eb-04f789eb5d29': 'deleted-lrna-pe-star-alignment-step',
    'j-michael-cherry:579e77ce-2594-42c1-82da-5f03ea2bb91b': 'deleted-lrna-se-star-unstranded-signals-for-tophat-step',
    'j-michael-cherry:5dfa4f70-7c1c-4684-846d-4e823e584349': 'dnase-seq-mapping-step',
    'j-michael-cherry:6cab4ead-7ae2-464a-903a-9d88725caf59': 'micro-rna-alignment-step',
    'j-michael-cherry:6dafd3a9-59b2-4625-843c-ea0ac27b3f6a': 'eclip-makebigwig-step',
    'j-michael-cherry:6dc5df87-a74e-4872-ab8c-37d3d607534a': 'nanostring-mapping-step',
    'j-michael-cherry:8110ea62-6d65-4698-bf7a-09dceeeaecab': 'dac-enhancer-like-ranking-method-step',
    'j-michael-cherry:86070670-8998-4abe-82fc-96471701d6d4': 'deleted-lrna-se-star-unstranded-signal-step',
    'j-michael-cherry:8a30a238-a240-49ca-ae33-476c2ed2f1b9': 'dnase-seq-peak-calling-step',
    'j-michael-cherry:8a78daa3-ef86-4203-acc0-a11d9c874697': 'deleted-lrna-pe-star-stranded-signal-step',
    'j-michael-cherry:a40d988e-3545-47f9-874d-64cef2b87ea0': 'deleted-rampage-grit-peak-calling-step',
    'j-michael-cherry:aa58b736-b5da-4e55-b448-b8011c7532bf': 'shrna-rna-splice-quant-step',
    'j-michael-cherry:b401cd82-f452-4226-bf60-b90f9f45e2d6': 'hic-liftover-step',
    'j-michael-cherry:c23d0095-b46d-45ac-8ad2-7894ea627a04': 'encode2-dgf-analysis-step',
    'j-michael-cherry:c9421dc2-4b79-425d-9912-b85036916725': 'dac-promotor-like-ranking-method-step',
    'j-michael-cherry:e064f272-2ad5-400d-b36e-f21ccb6b5a36': 'encode2-dnase-analysis-step',
    'j-michael-cherry:e8e4b418-0048-4b9f-b250-a9b97a16710e': 'shrna-rna-seq-map-step',
    'j-michael-cherry:fecdf1f3-6547-41f5-ae38-501437ef8357': 'deleted-dme-index-bismark-step',
    'j-michael-cherry:ff1f5989-1866-417e-a4b7-04879283cb3e': 'dnase-seq-mapping-peak-calling-step',
    'manuel-garber:atac_pipeline_fastq_alignment_n_filtration_step': 'ggr-lg1-atac-seq-fastq-align-n-filter-step',
    'manuel-garber:atac_pipeline_format_conversion_step': 'ggr-lg1-atac-seq-bet-to-bigwig-step',
    'manuel-garber:atac_pipeline_peak_calling_step': 'ggr-lg1-atac-seq-peak-calling-step',
    'manuel-garber:chip_pipeline_fastq_alignment_step': 'ggr-lg1-chip-seq-fastq-alignment-step',
    'manuel-garber:chip_pipeline_format_conversion_step': 'ggr-lg1-chip-seq-bam-to-bigwig-step',
    'manuel-garber:chip_pipeline_peak_calling_step': 'ggr-lg1-chip-seq-peak-calling-step',
    'manuel-garber:pipeline_1_bam_format_conversion': 'ggr-lg1-rna-seq-bam2bigwig-step',
    'manuel-garber:pipeline_1_fastq_filtration': 'ggr-lg1-rna-seq-fastq-filtration-step',
    'manuel-garber:pipeline_1_mapping': 'ggr-lg1-rna-seq-mapping-step',
    'manuel-garber:pipeline_1_rsem': 'ggr-lg1-rna-seq-rsem-step',
    'manuel-garber:pipeline_2_bam_format_conversion': 'ggr-lg2-rna-seq-bam2bigwig-step',
    'manuel-garber:pipeline_2_fastq_filtration_bowtie': 'ggr-lg2-rna-seq-fastq-filtration-bowtie-step',
    'manuel-garber:pipeline_2_fastq_filtration_tophat': 'ggr-lg2-rna-seq-fastq-filtration-tophat-step',
    'manuel-garber:pipeline_2_rsem': 'ggr-lg2-rna-seq-rsem-step',
    'modern:bitseq-step': 'modern-transcript-quantification-step',
    'modern:chip-seq-bwa-alignment-step-v-1': 'modern-bwa-alignment-step',
    'modern:chip-seq-bwa-indexing-step-v-1': 'modern-bwa-indexing-step',
    'modern:chip-seq-control-normalized-signal-generation-step-v-1': 'modern-chip-seq-control-normalized-signal-generation-step',
    'modern:chip-seq-filter-for-optimal-idr-peaks-step-v-1': 'modern-chip-seq-filter-for-optimal-idr-peaks-step',
    'modern:chip-seq-optimal-idr-step-v-1': 'modern-chip-seq-optimal-idr-step',
    'modern:chip-seq-optimal-idr-thresholded-peaks-to-bigbed-step-v-1': 'modern-chip-seq-optimal-idr-thresholded-peaks-to-bigbed-step',
    'modern:chip-seq-peaks-to-bigbed-step-v-1': 'modern-chip-seq-peaks-to-bigbed-step',
    'modern:chip-seq-read-depth-normalized-signal-generation-step-v-1': 'modern-chip-seq-read-depth-normalized-signal-generation-step',
    'modern:chip-seq-replicate-alignment-pooling-step-v-1': 'modern-chip-seq-replicate-alignment-pooling-step',
    'modern:chip-seq-replicate-pooled-control-normalized-signal-generation-step-v-1': 'modern-chip-seq-replicate-pooled-control-normalized-signal-generation-step',
    'modern:chip-seq-replicate-pooled-read-depth-normalized-signal-generation-step-v-1': 'modern-chip-seq-replicate-pooled-read-depth-normalized-signal-generation-step',
    'modern:chip-seq-replicate-pooled-unique-read-signal-generation-step-v-1': 'modern-chip-seq-replicate-pooled-unique-read-signal-generation-step',
    'modern:chip-seq-spp-peak-calling-step-v-1': 'modern-chip-seq-spp-peak-calling-step',
    'modern:chip-seq-unique-read-signal-generation-step-v-1': 'modern-chip-seq-unique-read-signal-generation-step',
    'modern:transcript alignment': 'modern-transcript-alignment-step',
    'ross-hardison:atac-seq-alignment-step-v-1': 'atac-seq-alignment-step',
    'ross-hardison:atac-seq-peak-calling-step-v-1': 'atac-seq-peak-calling-step',
    'ross-hardison:atac-seq-peak-filtering-step-v-1': 'atac-seq-peak-filtering-step',
    'ross-hardison:atac-seq-region-calling-step-v-1': 'atac-seq-region-calling-step',
    'ross-hardison:atac-seq-region-filter-step-v-1': 'atac-seq-region-filter-step',
    'ross-hardison:atac-seq-signal-gen-step-v-1': 'atac-seq-signal-gen-step',
    'thomas-gingeras:schatz-lab-variant-analysis-10x-longranger-phased-diploid-genome-v1': 'schatz-lab-variant-analysis-10x-longranger-phased-diploid-genome-step',
    'thomas-gingeras:variant-analysis-10x-longranger-align-call-phase-step-v-1': 'schatz-lab-variant-analysis-10x-longranger-align-call-phase-step',
    'thomas-gingeras:variant-analysis-10x-longranger-index-step-v-1': 'schatz-lab-variant-analysis-10x-longranger-index-step',
    'thomas-gingeras:variant-analysis-10x-vcf2diploid-phased-diploid-genome-rendering-step-v1': 'schatz-lab-variant-analysis-10x-vcf2diploid-phased-diploid-genome-step',
    'thomas-gingeras:variant-analysis-gatk-indel-filtering-step-v1': 'schatz-lab-variant-analysis-gatk-indel-filtering-step',
    'thomas-gingeras:variant-analysis-gatk-snp-filtering-step-v1': 'schatz-lab-variant-analysis-gatk-snp-filtering-step',
    'thomas-gingeras:variant-analysis-gatk-variant-calling-step-v1': 'schatz-lab-variant-analysis-gatk-variant-calling-step',
    'thomas-gingeras:variant-analysis-scalpel-filtering-step-v1': 'schatz-lab-variant-analysis-scalpel-filtering-step',
    'thomas-gingeras:variant-analysis-scalpel-variant-calling-step-v1': 'schatz-lab-variant-analysis-scalpel-variant-calling-step',
    'thomas-gingeras:variant-analysis-trim-bwa-mem-align-step-v1': 'schatz-lab-variant-analysis-trim-bwa-mem-align-filter-step',
    'thomas-gingeras:variant-analysis-trim-ngm-align-step-v1': 'schatz-lab-variant-analysis-trim-ngm-align-filter-step',
    'tim-reddy:chip_seq_bam_to_bigwig': 'ggr-tr1-chip-seq-quantification-step',
    'tim-reddy:chip_seq_bam_to_peaks': 'ggr-tr1-chip-seq-peak-calling-step',
    'tim-reddy:chip_seq_fastq_to_bam': 'ggr-tr1-chip-seq-mapping-filtering-step',
    'tim-reddy:dnase_seq_bam_to_bigwig': 'ggr-tr1-dnase-seq-quantification-step',
    'tim-reddy:dnase_seq_bam_to_peaks': 'ggr-tr1-dnase-seq-peak-calling-step',
    'tim-reddy:dnase_seq_fastq_to_bam': 'ggr-tr1-dnase-seq-mapping-filtering-step',
    'tim-reddy:hic_fastq_to_hic': 'ggr-tr1-hic-mapping-step',
    'tim-reddy:hic_hic_to_loops': 'ggr-tr1-hic-loop-calling-step',
    'tim-reddy:hic_hic_to_tads': 'ggr-tr1-hic-tad-calling-step',
    'tim-reddy:rna_seq_bam_to_bigwig_stranded': 'ggr-tr1-rna-seq-signal-generation-step',
    'tim-reddy:rna_seq_bam_to_gene_quantifications': 'ggr-tr1-rna-seq-gene-quantification-step',
    'tim-reddy:rna_seq_fastq_to_bam': 'ggr-tr1-rna-seq-trimming-mapping-step',
    'yijun-ruan:bam_to_bed': 'chia-pet-peak-calling-step',
    'yijun-ruan:bam_to_haplotype_specific_interactions': 'chia-pet-haplotype-specific-step',
    'yijun-ruan:bam_to_hic': 'chia-pet-chromatin-interactions-calling-step',
    'yijun-ruan:bam_to_loop': 'chia-pet-loop-calling-step',
    'yijun-ruan:fastq_to_bam': 'chia-pet-preprocessing-step',
    'zhiping-weng:bed-2-bigbed': 'bed-2-bigbed-step',
    'zhiping-weng:celltype-cre-id': 'celltype-cre-identification-step',
    'zhiping-weng:cluster-filter': 'cluster-filter-step',
    'zhiping-weng:generalized-cre-id': 'generalized-cre-identification-step'
}

major_version_mapping = {
    'ali-mortazavi:microRNA-alignment-v1': 1,
    'ali-mortazavi:microrna-quantification-step': 1,
    'ali-mortazavi:microrna-signal-step-v1': 1,
    'ali-mortazavi:nanostring-bigbed-step-v-1': 1,
    'ali-mortazavi:nsolver-step': 1,
    'anshul-kundaje:atac-seq-annotation-qc-step-single-replicate-v1': 1,
    'anshul-kundaje:atac-seq-annotation-qc-step-v1': 1,
    'anshul-kundaje:atac-seq-filtered-peaks-to-bigbed-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-filtered-peaks-to-bigbed-step-v1': 1,
    'anshul-kundaje:atac-seq-idr-peaks-to-bigbed-step-v1': 1,
    'anshul-kundaje:atac-seq-idr-step-v1': 1,
    'anshul-kundaje:atac-seq-overlap-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-overlap-step-v1': 1,
    'anshul-kundaje:atac-seq-peaks-filter-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-peaks-filter-step-v1': 1,
    'anshul-kundaje:atac-seq-pseudoreplicated-idr-peaks-to-bigbed-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-replicated-peaks-to-bigbed-step-v1': 1,
    'anshul-kundaje:atac-seq-signal-generation-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-signal-generation-step-v1': 1,
    'anshul-kundaje:atac-seq-stable-peaks-to-bigbed-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-trim-align-filter-step-single-rep-v1': 1,
    'anshul-kundaje:atac-seq-trim-align-filter-step-v1': 1,
    'anshul-kundaje:atac-seq-unreplicated-idr-step-single-rep-v1': 1,
    'christina-leslie:atac_seq_bam_to_bed': 1,
    'christina-leslie:atac_seq_fastq_to_bam': 1,
    'christina-leslie:atac_seq_idr_and_blacklist_filter': 1,
    'christina-leslie:chip_seq_bam_quantification': 1,
    'christina-leslie:chip_seq_fastq_to_bam': 1,
    'christina-leslie:rna_seq_bam_to_counts': 1,
    'christina-leslie:rna_seq_fastq_to_bam': 1,
    'dnanexus:align-star-pe-v-1': 1,
    'dnanexus:align-star-se-v-1': 1,
    'dnanexus:align-star-se-v-2': 2,
    'dnanexus:align-tophat-pe-v-1': 1,
    'dnanexus:align-tophat-se-v-1': 1,
    'dnanexus:bam-to-bigwig-pe-tophat-v-1': 1,
    'dnanexus:bam-to-bigwig-pe-v-1': 1,
    'dnanexus:bam-to-bigwig-se-tophat-v-1': 1,
    'dnanexus:bam-to-bigwig-se-v-1': 1,
    'dnanexus:bigbed-conversion-v-2.6': 1,
    'dnanexus:dme-align-pe-v-1': 1,
    'dnanexus:dme-align-se': 2,
    'dnanexus:dme-extract-pe-v-2': 1,
    'dnanexus:dme-extract-se-v-2': 1,
    'dnanexus:dme-index-bismark-bowtie2-v-2': 1,
    'dnanexus:dme-rep-corr-alt-v-1': 1,
    'dnanexus:dme-rep-corr-v-1': 1,
    'dnanexus:dnase-align-bwa-pe-v-1': 1,
    'dnanexus:dnase-align-bwa-se-v-1': 1,
    'dnanexus:dnase-call-hotspots-alt-v-1': 1,
    'dnanexus:dnase-call-hotspots-v-1': 1,
    'dnanexus:dnase-eval-bam-alt-v-1': 1,
    'dnanexus:dnase-eval-bam-v-1': 1,
    'dnanexus:dnase-filter-pe-v-1': 1,
    'dnanexus:dnase-filter-se-v-1': 1,
    'dnanexus:dnase-index-bwa-v-1': 1,
    'dnanexus:dnase-rep-corr-alt-v-1': 1,
    'dnanexus:dnase-rep-corr-v-1': 1,
    'dnanexus:mad-qc-alt-v-1': 1,
    'dnanexus:mad-qc-v-1': 1,
    'dnanexus:prep-rsem-v-1': 1,
    'dnanexus:prep-star-v-1': 1,
    'dnanexus:prep-tophat-v-1': 1,
    'dnanexus:quant-rsem-alt-v-1': 1,
    'dnanexus:quant-rsem-v-1': 1,
    'dnanexus:rampage-align-pe-v-1': 1,
    'dnanexus:rampage-idr-v-1': 1,
    'dnanexus:rampage-mad-qc-v-1': 1,
    'dnanexus:rampage-peaks-v-2': 1,
    'dnanexus:rampage-signals-v-1': 1,
    'dnanexus:small-rna-align-v-2': 1,
    'dnanexus:small-rna-mad-qc-v-1': 1,
    'dnanexus:small-rna-prep-star-v-2': 1,
    'dnanexus:small-rna-signals-v-1': 1,
    'encode:alignment-pooling-step': 1,
    'encode:bwa-alignment-step-v-1': 1,
    'encode:bwa-indexing-step-v-1': 1,
    'encode:bwa-raw-alignment-step-v-1': 1,
    'encode:frip_seq_pipeline_v1_alignmnet_step': 1,
    'encode:frip_seq_pipeline_v1_cuffdiff_step': 1,
    'encode:histone-overlap-peaks-step-v-1': 1,
    'encode:histone-peak-calling-step-v-1': 1,
    'encode:histone-peaks-to-bigbed-step-v-1': 1,
    'encode:histone-replicated-peaks-to-bigbed-step-v-1': 1,
    'encode:histone-unreplicated-partition-concordance-peaks-to-bigbed-step-v-1': 1,
    'encode:histone-unreplicated-partition-concordance-step-v-1': 1,
    'encode:histone-unreplicated-peak-calling-step-v-1': 1,
    'encode:histone-unreplicated-peaks-to-bigbed-step-v-1': 1,
    'encode:mango-step0-index-bowtie': 1,
    'encode:mango-step1-trim-linkers': 1,
    'encode:mango-step2-align-bowtie': 1,
    'encode:mango-step3-signal-generation': 1,
    'encode:mango-step4-macs2-call-peaks': 1,
    'encode:mango-step5-calc-interaction-confidence': 1,
    'encode:tf-idr-peaks-to-bigbed-step-v-1': 1,
    'encode:tf-idr-step-v-1': 1,
    'encode:tf-macs2-signal-calling-step-v-1': 1,
    'encode:tf-peaks-to-bigbed-step-v-1': 1,
    'encode:tf-spp-peak-calling-step-v-1': 1,
    'encode:tf-unreplicated-idr-peaks-to-bigbed-step-v-1': 1,
    'encode:tf-unreplicated-idr-step-v-1': 1,
    'encode:tf-unreplicated-macs2-signal-calling-step-v-1': 1,
    'encode:tf-unreplicated-peaks-to-bigbed-step-v-1': 1,
    'encode:tf-unreplicated-spp-peak-calling-step-v-1': 1,
    'encode:wgbs-bismark-alignment-step-v-1': 1,
    'dnanexus:dme-align-se-v-1': 1,
    'encode:wgbs-bismark-indexing-step-v-1': 1,
    'dnanexus:dme-index-bismark-v-2': 1,
    'encode:wgbs-bismark-quantification-step-v-1': 1,
    'gene-yeo:eclip_bed_to_bigbed': 1,
    'gene-yeo:eclip_fastq_to_bam': 1,
    'gene-yeo:eclip_signal_normal': 1,
    'j-michael-cherry:08fd0a3a-9d4f-483c-9316-e382da277344': 1,
    'j-michael-cherry:1ede083b-9220-4ee3-aca4-bf691f70e23e': 1,
    'j-michael-cherry:208715a1-1998-4191-9f00-16378333ccb1': 1,
    'j-michael-cherry:22dee925-30d9-4b01-ba3c-ea5cbfb15c98': 2,
    'j-michael-cherry:33c5bca6-5338-45b9-b837-04441d4b582c': 1,
    'j-michael-cherry:359d63f3-8e92-4731-a719-58fb7053bdb9': 2,
    'j-michael-cherry:3fa67405-fa88-4627-b3eb-04f789eb5d29': 2,
    'j-michael-cherry:579e77ce-2594-42c1-82da-5f03ea2bb91b': 2,
    'j-michael-cherry:5dfa4f70-7c1c-4684-846d-4e823e584349': 2,
    'j-michael-cherry:6cab4ead-7ae2-464a-903a-9d88725caf59': 1,
    'j-michael-cherry:6dafd3a9-59b2-4625-843c-ea0ac27b3f6a': 1,
    'j-michael-cherry:6dc5df87-a74e-4872-ab8c-37d3d607534a': 1,
    'j-michael-cherry:8110ea62-6d65-4698-bf7a-09dceeeaecab': 1,
    'j-michael-cherry:86070670-8998-4abe-82fc-96471701d6d4': 2,
    'j-michael-cherry:8a30a238-a240-49ca-ae33-476c2ed2f1b9': 2,
    'j-michael-cherry:8a78daa3-ef86-4203-acc0-a11d9c874697': 2,
    'j-michael-cherry:a40d988e-3545-47f9-874d-64cef2b87ea0': 1,
    'j-michael-cherry:aa58b736-b5da-4e55-b448-b8011c7532bf': 1,
    'j-michael-cherry:b401cd82-f452-4226-bf60-b90f9f45e2d6': 1,
    'j-michael-cherry:c23d0095-b46d-45ac-8ad2-7894ea627a04': 1,
    'j-michael-cherry:c9421dc2-4b79-425d-9912-b85036916725': 1,
    'j-michael-cherry:e064f272-2ad5-400d-b36e-f21ccb6b5a36': 1,
    'j-michael-cherry:e8e4b418-0048-4b9f-b250-a9b97a16710e': 1,
    'j-michael-cherry:fecdf1f3-6547-41f5-ae38-501437ef8357': 2,
    'j-michael-cherry:ff1f5989-1866-417e-a4b7-04879283cb3e': 1,
    'manuel-garber:atac_pipeline_fastq_alignment_n_filtration_step': 1,
    'manuel-garber:atac_pipeline_format_conversion_step': 1,
    'manuel-garber:atac_pipeline_peak_calling_step': 1,
    'manuel-garber:chip_pipeline_fastq_alignment_step': 1,
    'manuel-garber:chip_pipeline_format_conversion_step': 1,
    'manuel-garber:chip_pipeline_peak_calling_step': 1,
    'manuel-garber:pipeline_1_bam_format_conversion': 1,
    'manuel-garber:pipeline_1_fastq_filtration': 1,
    'manuel-garber:pipeline_1_mapping': 1,
    'manuel-garber:pipeline_1_rsem': 1,
    'manuel-garber:pipeline_2_bam_format_conversion': 1,
    'manuel-garber:pipeline_2_fastq_filtration_bowtie': 1,
    'manuel-garber:pipeline_2_fastq_filtration_tophat': 1,
    'manuel-garber:pipeline_2_rsem': 1,
    'modern:bitseq-step': 1,
    'modern:chip-seq-bwa-alignment-step-v-1': 1,
    'modern:chip-seq-bwa-indexing-step-v-1': 1,
    'modern:chip-seq-control-normalized-signal-generation-step-v-1': 1,
    'modern:chip-seq-filter-for-optimal-idr-peaks-step-v-1': 1,
    'modern:chip-seq-optimal-idr-step-v-1': 1,
    'modern:chip-seq-optimal-idr-thresholded-peaks-to-bigbed-step-v-1': 1,
    'modern:chip-seq-peaks-to-bigbed-step-v-1': 1,
    'modern:chip-seq-read-depth-normalized-signal-generation-step-v-1': 1,
    'modern:chip-seq-replicate-alignment-pooling-step-v-1': 1,
    'modern:chip-seq-replicate-pooled-control-normalized-signal-generation-step-v-1': 1,
    'modern:chip-seq-replicate-pooled-read-depth-normalized-signal-generation-step-v-1': 1,
    'modern:chip-seq-replicate-pooled-unique-read-signal-generation-step-v-1': 1,
    'modern:chip-seq-spp-peak-calling-step-v-1': 1,
    'modern:chip-seq-unique-read-signal-generation-step-v-1': 1,
    'modern:transcript alignment': 1,
    'ross-hardison:atac-seq-alignment-step-v-1': 1,
    'ross-hardison:atac-seq-peak-calling-step-v-1': 1,
    'ross-hardison:atac-seq-peak-filtering-step-v-1': 1,
    'ross-hardison:atac-seq-region-calling-step-v-1': 1,
    'ross-hardison:atac-seq-region-filter-step-v-1': 1,
    'ross-hardison:atac-seq-signal-gen-step-v-1': 1,
    'thomas-gingeras:schatz-lab-variant-analysis-10x-longranger-phased-diploid-genome-v1': 1,
    'thomas-gingeras:variant-analysis-10x-longranger-align-call-phase-step-v-1': 1,
    'thomas-gingeras:variant-analysis-10x-longranger-index-step-v-1': 1,
    'thomas-gingeras:variant-analysis-10x-vcf2diploid-phased-diploid-genome-rendering-step-v1': 1,
    'thomas-gingeras:variant-analysis-gatk-indel-filtering-step-v1': 1,
    'thomas-gingeras:variant-analysis-gatk-snp-filtering-step-v1': 1,
    'thomas-gingeras:variant-analysis-gatk-variant-calling-step-v1': 1,
    'thomas-gingeras:variant-analysis-scalpel-filtering-step-v1': 1,
    'thomas-gingeras:variant-analysis-scalpel-variant-calling-step-v1': 1,
    'thomas-gingeras:variant-analysis-trim-bwa-mem-align-step-v1': 1,
    'thomas-gingeras:variant-analysis-trim-ngm-align-step-v1': 1,
    'tim-reddy:chip_seq_bam_to_bigwig': 1,
    'tim-reddy:chip_seq_bam_to_peaks': 1,
    'tim-reddy:chip_seq_fastq_to_bam': 1,
    'tim-reddy:dnase_seq_bam_to_bigwig': 1,
    'tim-reddy:dnase_seq_bam_to_peaks': 1,
    'tim-reddy:dnase_seq_fastq_to_bam': 1,
    'tim-reddy:hic_fastq_to_hic': 1,
    'tim-reddy:hic_hic_to_loops': 1,
    'tim-reddy:hic_hic_to_tads': 1,
    'tim-reddy:rna_seq_bam_to_bigwig_stranded': 1,
    'tim-reddy:rna_seq_bam_to_gene_quantifications': 1,
    'tim-reddy:rna_seq_fastq_to_bam': 1,
    'yijun-ruan:bam_to_bed': 1,
    'yijun-ruan:bam_to_haplotype_specific_interactions': 1,
    'yijun-ruan:bam_to_hic': 1,
    'yijun-ruan:bam_to_loop': 1,
    'yijun-ruan:fastq_to_bam': 1,
    'zhiping-weng:bed-2-bigbed': 1,
    'zhiping-weng:celltype-cre-id': 1,
    'zhiping-weng:cluster-filter': 1,
    'zhiping-weng:generalized-cre-id': 1
}

title_mapping = {
    'j-michael-cherry:fecdf1f3-6547-41f5-ae38-501437ef8357': 'WGBS Bismark-bowtie1 genome indexing step - Version 2',
    'j-michael-cherry:ff1f5989-1866-417e-a4b7-04879283cb3e': 'DNase-seq mapping and peak calling step',
    'j-michael-cherry:3fa67405-fa88-4627-b3eb-04f789eb5d29': 'Long RNA-seq STAR paired-ended alignment step v2.0',
    'dnanexus:align-star-se-v-2': 'Long RNA-seq STAR single-ended alignment step v2.0',
    'dnanexus:dme-index-bismark-bowtie2-v-2': 'WGBS Bismark-bowtie2 genome indexing step - Version 1'
}

status_mapping = {
    'encode:alignment-pooling-step': 'released',
    'j-michael-cherry:33c5bca6-5338-45b9-b837-04441d4b582c': 'released',
    'dnanexus:dme-extract-se-v-2': 'released',
    'dnanexus:dme-rep-corr-alt-v-1': 'released',
    'dnanexus:dme-rep-corr-v-1': 'released',
    'modern:chip-seq-filter-for-optimal-idr-peaks-step-v-1': 'released',
    'modern:chip-seq-optimal-idr-thresholded-peaks-to-bigbed-step-v-1': 'released'
}

aliases_mapping = {
    'dnanexus:align-star-se-v-2': 'encode:deleted-lrna-se-star-alignment-step-v-2',
    'encode:alignment-pooling-step': 'encode:alignment-pooling-step-v-1',
    'encode:frip_seq_pipeline_v1_alignmnet_step': 'encode:frip-seq-pipeline-alignment-step-v-1'
    'j-michael-cherry:08fd0a3a-9d4f-483c-9316-e382da277344': 'encode:control-alignment-subsampling-step-v-1',
    'j-michael-cherry:1ede083b-9220-4ee3-aca4-bf691f70e23e': 'encode:shrna-rna-seq-signal-step-v-1',
    'j-michael-cherry:208715a1-1998-4191-9f00-16378333ccb1': 'john-stamatoyannopoulos:dnase-bed-to-bigbed-v-1',
    'j-michael-cherry:22dee925-30d9-4b01-ba3c-ea5cbfb15c98': 'encode:deleted-lrna-pe-star-stranded-signals-for-tophat-step-v-2',
    'j-michael-cherry:33c5bca6-5338-45b9-b837-04441d4b582c': 'encode:alignment-subsampling-step-v-1',
    'j-michael-cherry:359d63f3-8e92-4731-a719-58fb7053bdb9': 'encoded:deleted-lrna-index-star-v-2',
    'j-michael-cherry:3fa67405-fa88-4627-b3eb-04f789eb5d29': 'encode:deleted-lrna-pe-star-alignment-step-v-2',
    'j-michael-cherry:579e77ce-2594-42c1-82da-5f03ea2bb91b': 'encode:deleted-lrna-se-star-unstranded-signals-for-tophat-step-v-2',
    'j-michael-cherry:5dfa4f70-7c1c-4684-846d-4e823e584349': 'john-stamatoyannopoulos:dnase-seq-mapping-step-v-2',
    'j-michael-cherry:6cab4ead-7ae2-464a-903a-9d88725caf59': 'ali-mortazavi:micro-rna-alignment-step-v-1',
    'j-michael-cherry:6dafd3a9-59b2-4625-843c-ea0ac27b3f6a': 'gene-yeo:eclip-makebigwig-step-v-1',
    'j-michael-cherry:6dc5df87-a74e-4872-ab8c-37d3d607534a': 'ali-mortazavi:nanostring-mapping-step-v-1',
    'j-michael-cherry:8110ea62-6d65-4698-bf7a-09dceeeaecab': 'zhiping-weng:dac-enhancer-like-ranking-method-step-v-1',
    'j-michael-cherry:86070670-8998-4abe-82fc-96471701d6d4': 'encode:deleted-lrna-se-star-unstranded-signal-step-v-2',
    'j-michael-cherry:8a30a238-a240-49ca-ae33-476c2ed2f1b9': 'john-stamatoyannopoulos:dnase-seq-peak-calling-step-v-2',
    'j-michael-cherry:8a78daa3-ef86-4203-acc0-a11d9c874697': 'encode:deleted-lrna-pe-star-stranded-signal-step-v-2',
    'j-michael-cherry:a40d988e-3545-47f9-874d-64cef2b87ea0': 'encode:deleted-rampage-grit-peak-calling-step-v-1',
    'j-michael-cherry:aa58b736-b5da-4e55-b448-b8011c7532bf': 'encode:shrna-rna-splice-quant-step-v-1',
    'j-michael-cherry:b401cd82-f452-4226-bf60-b90f9f45e2d6': 'zhiping-weng:hic-liftover-step-v-1',
    'j-michael-cherry:c23d0095-b46d-45ac-8ad2-7894ea627a04': 'john-stamatoyannopoulos:encode2-dgf-analysis',
    'j-michael-cherry:c9421dc2-4b79-425d-9912-b85036916725': 'zhiping-weng:dac-promoter-like-ranking-method-step-v-1',
    'j-michael-cherry:e064f272-2ad5-400d-b36e-f21ccb6b5a36': 'john-stamatoyannopoulos:encode2-dnase-analysis',
    'j-michael-cherry:e8e4b418-0048-4b9f-b250-a9b97a16710e': 'encode:shrna-rna-seq-map-step-v-1',
    'j-michael-cherry:fecdf1f3-6547-41f5-ae38-501437ef8357': 'dnanexus:deleted-dme-index-bismark-step-v-2',
    'j-michael-cherry:ff1f5989-1866-417e-a4b7-04879283cb3e': 'john-stamatoyannopoulos:dnase-seq-mapping-peak-calling-step-v-1'
}
