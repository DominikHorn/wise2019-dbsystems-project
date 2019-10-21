export const sleep = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

// Credit for large portions of this function: Alexander Vogelgsang from itestra
export const stripTypenameRecursively = (val: any): any => {
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(stripTypenameRecursively);
  }
  if (typeof val === "object") {
    return stripTypenameRecursivelyFromObject<typeof val>(val);
  }
  // Basic type -> simply return
  return val;
};

// Credit for large portions of this function: Alexander Vogelgsang from itestra
const stripTypenameRecursivelyFromObject = <T extends { [key: string]: any }>(
  obj: T
) => {
  // Date is an 'atomic object type'
  if (obj instanceof Date) return obj;

  const res: { [key: string]: any } = {};
  Object.keys(obj).forEach(key => {
    if (key !== "__typename") {
      res[key] = obj[key];
    }
  });
  return res;
};

export const isDevelopmentEnv = () => process.env.NODE_ENV === "development";