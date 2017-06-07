export function filterEmptySlots<T>(arr: T[]): T[] {
    return arr.reduce((previousValue, currentValue) => {
        if (currentValue != null && currentValue != undefined) {
            previousValue.push(currentValue);
        }
        return previousValue;
    }, [])
}