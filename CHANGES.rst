Changes
=======

2.0.3 Release  (Data Services Release)
--------------------------------
Footprinting files were adjusted to correct assembly
REG-227 update experiment annotation links
REG-198-add-download-button
REG-229 Convert backend to Dataservices
	1.	dataset key fix
	2.	adding file download redirect for genome browse
	3.	redirecting to coordinates page when summary has one result
	4.	adding encode redirect for cors requests
	5.	avoiding 301 to www and losing CORS headers
	6.	using Encode as source of files
	7.	fixing absolute hrefs for accessibility widget
	8.	fixing absolute hrefs for widgets
	9.	valis bug fix, checking if facet exists before 
	10.	adding absolute hrefs for search
	11.	fix relative href
	12.	making data service url configurable
	13.	removing postgres and ES references
	14.	adding custom 404 page
	15.	clean up unused methods
	16.	using gp3 for EBS
	17.	removing ES and Postgres from deployment
	18.	restoring deploy script
	19.	cleaning up buildout and configs
	20.	removing indexer endpoints
	21.	removing need of DB and/or ES
	22.	removing profiles-title fetch
	23.	removing snovault, sign-on, help pages from db
	24.	turning help page into a static page
	25.	removing test workbook
	26.	removing cart and vis indexer
	27.	removing configs
	28.	handling file downloads
	29.	connecting search endpoints with data service


2.0.2 release - virtual (snovault 1.0.26)
--------------------------------
REG-217-default-MAF-filter to 0
REG-209-script-search-snps-in-region (#104)
REG-212-update-IC_max-precalculated-bigWig (#105)
REG-210-fix-download-summary-bug (#103)
always 16GB heap for ES
revert s3 uri for href
using s3_uri as href for files when available
removing proxy servers for downloads
updating regulome s3 paths
REG-200 Add Elasticsearch log compression cron job (#95)
REG-199-index-filter-MAF (#93)
REG-197-change-homepage-title (#92)
REG-196-parallelize-regulome-search-script (#91)
REG-194-trim-script-output-for-peak-information (#90)
REG-191-Change-JVM-GC-to-G1GC (#88)


2.0.1 release - virtual (snovault 1.0.26)
--------------------------------
remove beta banner (#84)
fix google analytics (#87)
REG-186-restrict-to-old-chromatin-state-data (#86)
REG-187-optimize-script-memory-usage (#85)
add link to legacy site (#82)
accessibility page redesign (#75)
REG-161-add-marked-location (#76)
REG-169 return matched PWM peaks in script (#74)
REG-14 update dbSNP reference (#78)
REG-175 update coordinates examples (#73)
REG-178 fix motif error (#77)
REG-174 Freeze setuptools at v43 (#72)
REG-171 add reset for browser (#70)
REG-142 add regulome summary download (#69)
REG-170 fix accessibility page alignment (#67)
REG-165 update motif summaries (#64)
REG-152 scoring script
REG-127 Ignore archived files if there is any released file


2.0.0 BETA release virtual (snovault 1.0.26)
--------------------------------
REG-68 Use all ENCODE data
REG-168 fix ENCODE file download (#63)
REG-164 update motif colors (#62)
REG-137 add filters to browser (#57)
REG-162 collapse and align motifs (#58)
REG-148 regulome-search to process one arbitrary region (#60)
REG-163 fix discrepancy in MAF cutoff (#59)
REG-158 update regulome tests for scores (#56)
REG-143 fix browser issues (#47)
REG-155 sort table by score properly (#55)
REG-154 remove ChIP and DNase signals from scoring algorithm (#53)
REG-147 upgrade React (#51)
REG-153 add beta banner (#52)
REG-151 fix chromatin graphic (#54)
REG-119 motif alignments (#50)
REG-136 add back button functionality (#46)
REG-145 updates to beta website (#48)
REG-149 fix table sorting (#49)
REG-121 update QTL thumbnail (#45)
REG-144 fix accessibility counts (#44)
REG-140 split summary table (#43)
REG-116 Genome browser (#42)
REG-91 chromatin visualization (#41)
REG-128 use peak metadata (#40)
REG-130 fix query (#39)
REG-74 Summary graphic and clickable thumbnails (#38)
REG-124 update scoring algorithm (#37)
REG-120 index value and strand (#32)
REG-126-update-to-java-install-manual (#36)
REG-123 Get feature values from pre-calculated bigWig files (#31)
REG-104 make search result smaller (#30)
REG-106 fix for biosample in details plus tests (#25)
REG-110 Downgrade scikit-learn (#28)
REG-108 REG-111 mixed tests (#29)
REG-109 update sauce connect to 4.5.3 (#27)
REG-105 manual rebase (#24)
REG-101 invert index (#22)
REG-71 add PWM logos (#21)
REG-97 split regulome (#20)
REG-102 remove cart test (#18)
REG-94 IE bug fixes (#14)
REG-84 new regulome scoring algorithm (#7)
ENCD-4581 Temp install java 8 through aws
REG-90 Encode-related updates
SNO-73 Add uuid queue module
ENCD-4456 Override update objs in vis reg indexers
ENCD-4240 Allow review characterizations (#2591)
REG-92 fix clickable FAQ for Safari and Firefox (#13)
REG-83 fix overlapping icons (#11)
REG-88 fix biosample info (#9)
REG-89 update logos (#10) 
REG-82 fix overflowing bar charts and style errors (#8)
REG-69 fix region search parameter parsing (#6)
REG-72 cleanup region index (#5)
REG-80 Add travis sauce labs keys (#4)
[FORK] Default git repo to regulome-encoded
REG-51 visualizations, REG-67 graph, REG-52 table, REG-44 UI updates (#20)
REG-27 add links of PWM to regulome search results (#16)
REG-27 Add PWM document (#12)
REG-68 make regulome indexer/scoring compatible with ENCD-3998 (#10)
REG-34 make compatible with ENCD-3998
REG-49 Input page (#2480)
REG-57 fix bdd tests for menu bar changes
REG-63 squashed changes updates to user interface
REG-52 Regulome Detail Page
REG-62 [SQUASH] fix impersonate and tests (#2455)
REG-62 redirect regulome homepage (#2453)
REG-54 Get regulome peak details
REG-49 [SQUASH] [Backend] debug scorable search (#2451)
REG-49 [Backend] Multi-region search (#2426)
REG-45 try to handle some region index error. (#2449)
REG-34 local tests (#2427)
REG-48 debug scoring algorithm.
REG-46 add new types for curated data and update changelogs.
REG-38-parse-zero-length-SNP (#2362)
REG-39 Regulome Release 1 (#2279)
