import _ from 'underscore';
import { convertPwmTextToObj, convertJasparTextToObj } from '../motifs';

const pwmString = 'DE\tRUNX1\tMA0002.2\n0\t287\t496\t696\t521\tX\n1\t234\t485\t467\t814\tX\n2\t123\t1072\t149\t656\tX\n3\t57\t0\t7\t1936\tX\n4\t0\t75\t1872\t53\tX\n5\t87\t127\t70\t1716\tX\n6\t0\t0\t1987\t13\tX\n7\t17\t42\t1848\t93\tX\n8\t10\t400\t251\t1339\tX\n9\t131\t463\t81\t1325\tX\n10\t500\t158\t289\t1053\tX\nXX';

const jasparString = 'MA0002.2\tRUNX1\nA  [   287    234    123     57      0     87      0     17     10    131    500 ]\nC  [   496    485   1072      0     75    127      0     42    400    463    158 ]\nG  [   696    467    149      7   1872     70   1987   1848    251     81    289 ]\nT  [   521    814    656   1936     53   1716     13     93   1339   1325   1053 ]';

describe('Motifs', () => {
    describe('Compare motif format', () => {
        test('Convert text into objects and compare', () => {
            const pwmObj = convertPwmTextToObj(pwmString);
            const jasparObj = convertJasparTextToObj(jasparString);

            const equalObjs = _.isEqual(pwmObj, jasparObj);

            expect(equalObjs).toEqual(true);
        });
    });
});
