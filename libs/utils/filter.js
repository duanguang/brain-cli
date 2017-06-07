"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function filterEmptySlots(arr) {
    return arr.reduce((previousValue, currentValue) => {
        if (currentValue != null && currentValue != undefined) {
            previousValue.push(currentValue);
        }
        return previousValue;
    }, []);
}
exports.filterEmptySlots = filterEmptySlots;
