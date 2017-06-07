const deepAssign = require('deep-assign');
import {expect} from 'chai';
describe('deep-assign', function () {
    it('simple object deep assign', () => {
        const result = deepAssign({}, {test: true});
        expect(result.hasOwnProperty('test')).to.be.equal(true);
    });

    it('simple array deep assign', () => {
        const result: any[] = deepAssign([], [0, 1]);
        result.forEach((item, index) => {
            expect(item).to.be.equal(index);
        });
    });

    it('simple array undefined deep assign', () => {
        expect(() => deepAssign(undefined, [0, 1])).to.be.throws();
    });

    it('simple array deep assign with potential conflict ', () => {
        deepAssign([10, 20, 2], [0, 1]).forEach((item, index) => {
            expect(item).to.be.equal(index);
        });
    });
});