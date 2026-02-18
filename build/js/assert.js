function assertExistance(value, message) {
    if (value === null || value === undefined)
        throw new Error(message ?? "Value failed non-null assertion!");
    return value;
}
function assertCondition(value, message) {
    if (!value)
        throw new Error(message ?? "Condition false!");
}
export { assertExistance, assertCondition };
//# sourceMappingURL=assert.js.map