function assertExistance<T>(value: any, message?: string): T
{
    if(value === null || value === undefined) throw new Error(message ?? "Value failed non-null assertion!");
    return value;
}

function assertCondition(value: boolean, message?: string): void
{
    if(!value) throw new Error(message ?? "Condition false!");
}

export { assertExistance, assertCondition };