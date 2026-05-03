// @bun
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/tui.ts
import { createComponent as createComponent2 } from "solid-js";

// node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// src/lib/config/plugin.ts
var treeStorageScopeSchema = exports_external.enum(["global", "local"]);
var treePluginOptionsSchema = exports_external.object({
  storageScope: treeStorageScopeSchema.default("global")
}).passthrough();
function parseTreePluginOptions(options) {
  const parsed = treePluginOptionsSchema.parse(options ?? {});
  return {
    storageScope: parsed.storageScope
  };
}

// src/lib/opencode/messages.ts
var DEFAULT_PAGE_SIZE = 100;
function compareMessageRecords(left, right) {
  const timeDiff = left.info.time.created - right.info.time.created;
  if (timeDiff !== 0)
    return timeDiff;
  return left.info.id.localeCompare(right.info.id);
}
function sortTranscriptMessages(messages) {
  return [...messages].sort(compareMessageRecords);
}
function createSessionTranscript(input) {
  const messageById = new Map;
  const messageIndexById = new Map;
  for (const [index, message] of input.messages.entries()) {
    messageById.set(message.info.id, message);
    messageIndexById.set(message.info.id, index);
  }
  return {
    sessionId: input.sessionId,
    status: input.status,
    messages: input.messages,
    messageById,
    messageIndexById
  };
}
function createSessionMessagesPageLoader(client, options = {}) {
  return async (input) => {
    const result = await client.session.messages({
      sessionID: input.sessionId,
      directory: options.directory,
      workspace: options.workspace,
      limit: input.limit,
      before: input.before
    });
    const statusCode = result.response?.status;
    if (statusCode === 404 || isNotFoundError(result.error)) {
      return {
        status: "deleted",
        items: []
      };
    }
    if (result.error) {
      throw createSessionMessagesLoadError(input.sessionId, result.error, statusCode);
    }
    return {
      status: "available",
      items: (result.data ?? []).map((item) => ({ info: item.info, parts: item.parts })),
      nextCursor: result.response?.headers.get("x-next-cursor") ?? undefined
    };
  };
}
async function loadSessionTranscript(sessionId, loadPage, pageSize = DEFAULT_PAGE_SIZE) {
  const messagesById = new Map;
  const seenCursors = new Set;
  let before;
  while (true) {
    const page = await loadPage({
      sessionId,
      before,
      limit: pageSize
    });
    if (page.status === "deleted") {
      return createSessionTranscript({
        sessionId,
        status: "deleted",
        messages: []
      });
    }
    for (const item of page.items) {
      messagesById.set(item.info.id, item);
    }
    if (!page.nextCursor) {
      return createSessionTranscript({
        sessionId,
        status: "available",
        messages: sortTranscriptMessages(messagesById.values())
      });
    }
    if (seenCursors.has(page.nextCursor)) {
      throw new Error(`Repeated message pagination cursor for session ${sessionId}`);
    }
    seenCursors.add(page.nextCursor);
    before = page.nextCursor;
  }
}
async function loadSnapshotSessionTranscripts(snapshot, loadTranscript) {
  const sessionIds = Object.keys(snapshot.sessions).sort((left, right) => left.localeCompare(right));
  const entries = await Promise.all(sessionIds.map(async (sessionId) => [sessionId, await loadTranscript(sessionId)]));
  return Object.fromEntries(entries);
}
function createSnapshotSessionTranscriptsLoader(client, options = {}) {
  const loadPage = createSessionMessagesPageLoader(client, options);
  return (snapshot) => loadSnapshotSessionTranscripts(snapshot, (sessionId) => loadSessionTranscript(sessionId, loadPage, options.pageSize));
}
function getMessageTextReplay(parts) {
  const text = collectMessageText(parts);
  return text?.length ? text : undefined;
}
function serializeSessionMessageRecordsForSummary(messages) {
  return messages.map(serializeSessionMessageRecordForSummary).filter((blocks) => blocks.length > 0).map((blocks) => blocks.join(`
`)).join(`

`);
}
function serializeSessionMessageRecordForSummary(record) {
  const text = collectMessageText(record.parts);
  const files = collectMessageFiles(record.parts);
  const fallbackPartTypes = collectFallbackPartTypes(record.parts);
  if (record.info.role === "user") {
    return buildUserMessageBlocks(text, files, fallbackPartTypes);
  }
  return buildAssistantMessageBlocks({
    text,
    reasoning: collectReasoningText(record.parts),
    toolCalls: collectToolCalls(record.parts),
    files,
    fallbackPartTypes
  });
}
function buildUserMessageBlocks(text, files, fallbackPartTypes) {
  const blocks = [];
  if (text) {
    blocks.push(`[User]: ${text}`);
  }
  if (files.length > 0) {
    blocks.push(`[User files]: ${files.join(", ")}`);
  }
  if (fallbackPartTypes.length > 0) {
    blocks.push(`[User parts]: ${fallbackPartTypes.join(", ")}`);
  }
  return blocks;
}
function buildAssistantMessageBlocks(input) {
  const blocks = [];
  if (input.reasoning) {
    blocks.push(`[Assistant reasoning]: ${input.reasoning}`);
  }
  if (input.text) {
    blocks.push(`[Assistant]: ${input.text}`);
  }
  if (input.toolCalls.length > 0) {
    blocks.push(`[Assistant tool calls]: ${input.toolCalls.join("; ")}`);
  }
  if (input.files.length > 0) {
    blocks.push(`[Assistant files]: ${input.files.join(", ")}`);
  }
  if (input.fallbackPartTypes.length > 0) {
    blocks.push(`[Assistant parts]: ${input.fallbackPartTypes.join(", ")}`);
  }
  return blocks;
}
function collectMessageText(parts) {
  const text = parts.filter((part) => part.type === "text").filter((part) => !part.synthetic && !part.ignored).map((part) => part.text).join("").trim();
  return text.length > 0 ? text : undefined;
}
function collectReasoningText(parts) {
  const reasoning = parts.filter((part) => part.type === "reasoning").map((part) => part.text.trim()).filter((text) => text.length > 0).join(`
`);
  return reasoning.length > 0 ? reasoning : undefined;
}
function collectToolCalls(parts) {
  return parts.filter((part) => part.type === "tool").map((part) => formatToolCall(part));
}
function collectMessageFiles(parts) {
  const labels = [];
  for (const part of parts) {
    if (part.type !== "file")
      continue;
    labels.push(getFilePartLabel(part));
  }
  return labels;
}
function collectFallbackPartTypes(parts) {
  const types2 = [];
  const seen = new Set;
  for (const part of parts) {
    if (part.type === "text" || part.type === "reasoning" || part.type === "tool" || part.type === "file") {
      continue;
    }
    if (part.type === "step-start" || part.type === "step-finish") {
      continue;
    }
    if (seen.has(part.type)) {
      continue;
    }
    seen.add(part.type);
    types2.push(part.type);
  }
  return types2;
}
function formatToolCall(part) {
  const args = Object.entries(part.state.input).map(([key, value]) => `${key}=${formatToolArgumentValue(value)}`).join(", ");
  if (!args) {
    return `${part.tool}()`;
  }
  return `${part.tool}(${args})`;
}
function formatToolArgumentValue(value) {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value === null)
    return "null";
  if (Array.isArray(value) || typeof value === "object") {
    const json = JSON.stringify(value);
    if (json)
      return json;
  }
  return JSON.stringify(String(value));
}
function getFilePartLabel(part) {
  if (part.filename)
    return part.filename;
  const source = part.source;
  if (source?.type === "file" || source?.type === "symbol") {
    return source.path;
  }
  if (source?.type === "resource") {
    return source.uri;
  }
  return part.url;
}
function isNotFoundError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "NotFoundError";
}
function createSessionMessagesLoadError(sessionId, error, statusCode) {
  const prefix = `Failed to load messages for session ${sessionId}`;
  const message = getSessionMessagesLoadErrorMessage(error);
  if (statusCode !== undefined && message) {
    return new Error(`${prefix} (${statusCode}): ${message}`);
  }
  if (statusCode !== undefined) {
    return new Error(`${prefix} (${statusCode})`);
  }
  if (message) {
    return new Error(`${prefix}: ${message}`);
  }
  return new Error(prefix);
}
function getSessionMessagesLoadErrorMessage(error) {
  if (isNotFoundError(error)) {
    return error.data?.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return;
}

// src/lib/storage/file.ts
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { dirname } from "path";

class StorageFileError extends Error {
  filePath;
  constructor(message, filePath, options) {
    super(message, options);
    this.name = new.target.name;
    this.filePath = filePath;
  }
}

class StorageJsonParseError extends StorageFileError {
  constructor(filePath, cause) {
    super(`Invalid JSON in ${filePath}`, filePath, {
      cause: cause instanceof Error ? cause : undefined
    });
  }
}

class StorageSchemaError extends StorageFileError {
  issues;
  constructor(filePath, issues) {
    super(`Invalid storage schema in ${filePath}`, filePath);
    this.issues = issues;
  }
}
function isFileNotFoundError(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
async function readJsonFile(filePath, schema) {
  const raw = await readFile(filePath, "utf8");
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new StorageJsonParseError(filePath, error);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new StorageSchemaError(filePath, parsed.error.issues);
  }
  return parsed.data;
}
async function writeJsonFile(filePath, schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new StorageSchemaError(filePath, parsed.error.issues);
  }
  await mkdir(dirname(filePath), { recursive: true });
  const tempFilePath = `${filePath}.${randomUUID()}.tmp`;
  const content = `${JSON.stringify(parsed.data, null, 2)}
`;
  try {
    await writeFile(tempFilePath, content, "utf8");
    await rename(tempFilePath, filePath);
  } catch (error) {
    await rm(tempFilePath, { force: true }).catch(() => {
      return;
    });
    throw new StorageFileError(`Failed to write ${filePath}`, filePath, {
      cause: error instanceof Error ? error : undefined
    });
  }
  return parsed.data;
}
// src/lib/storage/location.ts
import { createHash } from "crypto";
import { basename, join } from "path";
var pluginStorageDirectoryName = "opencode-tree";
function resolveStorageRoot(input) {
  const projectRoot = requireNonEmptyPath(input.projectRoot, "projectRoot");
  if (input.storageScope === "local") {
    return join(projectRoot, ".opencode", pluginStorageDirectoryName);
  }
  const stateRoot = requireNonEmptyPath(input.stateRoot, "stateRoot");
  return join(stateRoot, "plugins", pluginStorageDirectoryName, "projects", createProjectStorageKey(projectRoot));
}
function createProjectStorageKey(projectRoot) {
  const normalizedProjectRoot = requireNonEmptyPath(projectRoot, "projectRoot");
  const projectName = toStorageSlug(basename(normalizedProjectRoot));
  const projectHash = createHash("sha256").update(normalizedProjectRoot).digest("hex").slice(0, 12);
  return `${projectName}-${projectHash}`;
}
function requireNonEmptyPath(value, label) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Missing ${label}`);
  }
  return normalized;
}
function toStorageSlug(value) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "project";
}
// src/lib/storage/paths.ts
import { join as join2 } from "path";
function getTreesRootPath(storageRoot) {
  return join2(storageRoot, "trees");
}
function getRegistryFilePath(storageRoot) {
  return join2(storageRoot, "registry.json");
}
function getTreeDirectoryPath(storageRoot, treeId) {
  return join2(getTreesRootPath(storageRoot), treeId);
}
function getSnapshotFilePath(storageRoot, treeId) {
  return join2(getTreeDirectoryPath(storageRoot, treeId), "snapshot.json");
}
// src/lib/storage/schema.ts
var STORAGE_VERSION = 1;
var sessionIDSchema = exports_external.string().min(1);
var treeIDSchema = exports_external.string().min(1);
var messageIDSchema = exports_external.string().min(1);
var registrySchema = exports_external.object({
  version: exports_external.literal(STORAGE_VERSION),
  sessions: exports_external.record(sessionIDSchema, treeIDSchema)
}).strict();
var snapshotSessionSchema = exports_external.object({
  sessionId: sessionIDSchema,
  parentSessionId: sessionIDSchema.nullable(),
  anchorMessageId: messageIDSchema.nullable(),
  children: exports_external.array(sessionIDSchema)
}).strict();
var snapshotSchema = exports_external.object({
  version: exports_external.literal(STORAGE_VERSION),
  treeId: treeIDSchema,
  rootSessionId: sessionIDSchema,
  sessions: exports_external.record(sessionIDSchema, snapshotSessionSchema)
}).strict().superRefine((snapshot, ctx) => {
  const sessionEntries = Object.entries(snapshot.sessions);
  const childIdSetBySessionId = new Map;
  for (const [sessionKey, node] of sessionEntries) {
    const childIdSet = new Set(node.children);
    childIdSetBySessionId.set(sessionKey, childIdSet);
    if (childIdSet.size !== node.children.length) {
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message: "children must not contain duplicates",
        path: ["sessions", sessionKey, "children"]
      });
    }
  }
  const rootNode = snapshot.sessions[snapshot.rootSessionId];
  if (!rootNode) {
    ctx.addIssue({
      code: exports_external.ZodIssueCode.custom,
      message: `rootSessionId ${snapshot.rootSessionId} is missing from sessions`,
      path: ["rootSessionId"]
    });
    return;
  }
  if (rootNode.parentSessionId !== null) {
    ctx.addIssue({
      code: exports_external.ZodIssueCode.custom,
      message: "root session must have parentSessionId null",
      path: ["sessions", snapshot.rootSessionId, "parentSessionId"]
    });
  }
  if (rootNode.anchorMessageId !== null) {
    ctx.addIssue({
      code: exports_external.ZodIssueCode.custom,
      message: "root session must have anchorMessageId null",
      path: ["sessions", snapshot.rootSessionId, "anchorMessageId"]
    });
  }
  for (const [sessionKey, node] of sessionEntries) {
    if (node.sessionId !== sessionKey) {
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message: `session key ${sessionKey} must match sessionId ${node.sessionId}`,
        path: ["sessions", sessionKey, "sessionId"]
      });
    }
    if (node.parentSessionId === node.sessionId) {
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message: "session cannot be its own parent",
        path: ["sessions", sessionKey, "parentSessionId"]
      });
    }
    if (sessionKey !== snapshot.rootSessionId && node.parentSessionId === null) {
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message: "non-root session must have parentSessionId",
        path: ["sessions", sessionKey, "parentSessionId"]
      });
    }
    if (sessionKey !== snapshot.rootSessionId && node.anchorMessageId === null) {
      ctx.addIssue({
        code: exports_external.ZodIssueCode.custom,
        message: "non-root session must have anchorMessageId",
        path: ["sessions", sessionKey, "anchorMessageId"]
      });
    }
    if (node.parentSessionId !== null) {
      const parentNode = snapshot.sessions[node.parentSessionId];
      const parentChildIdSet = childIdSetBySessionId.get(node.parentSessionId);
      if (!parentNode) {
        ctx.addIssue({
          code: exports_external.ZodIssueCode.custom,
          message: `parent session ${node.parentSessionId} is missing`,
          path: ["sessions", sessionKey, "parentSessionId"]
        });
      } else if (!parentChildIdSet?.has(node.sessionId)) {
        ctx.addIssue({
          code: exports_external.ZodIssueCode.custom,
          message: `parent session ${node.parentSessionId} must list ${node.sessionId} in children`,
          path: ["sessions", node.parentSessionId, "children"]
        });
      }
    }
    for (const [childIndex, childSessionId] of node.children.entries()) {
      const childNode = snapshot.sessions[childSessionId];
      if (!childNode) {
        ctx.addIssue({
          code: exports_external.ZodIssueCode.custom,
          message: `child session ${childSessionId} is missing`,
          path: ["sessions", sessionKey, "children", childIndex]
        });
        continue;
      }
      if (childNode.parentSessionId !== node.sessionId) {
        ctx.addIssue({
          code: exports_external.ZodIssueCode.custom,
          message: `child session ${childSessionId} must point back to parent ${node.sessionId}`,
          path: ["sessions", childSessionId, "parentSessionId"]
        });
      }
    }
  }
});
function createEmptyRegistry() {
  return {
    version: STORAGE_VERSION,
    sessions: {}
  };
}

// src/lib/storage/registry.ts
async function readRegistry(storageRoot) {
  const filePath = getRegistryFilePath(storageRoot);
  try {
    return await readJsonFile(filePath, registrySchema);
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return createEmptyRegistry();
    }
    throw error;
  }
}
async function writeRegistry(storageRoot, registry) {
  return writeJsonFile(getRegistryFilePath(storageRoot), registrySchema, registry);
}
function registerSessionTree(registry, sessionId, treeId) {
  const existingTreeId = registry.sessions[sessionId];
  if (!existingTreeId) {
    return {
      ...registry,
      sessions: {
        ...registry.sessions,
        [sessionId]: treeId
      }
    };
  }
  if (existingTreeId === treeId) {
    return registry;
  }
  throw new Error(`Session ${sessionId} is already registered to tree ${existingTreeId}`);
}
// src/lib/storage/snapshot.ts
async function readSnapshot(storageRoot, treeId) {
  return readJsonFile(getSnapshotFilePath(storageRoot, treeId), snapshotSchema);
}
async function writeSnapshot(storageRoot, snapshot) {
  return writeJsonFile(getSnapshotFilePath(storageRoot, snapshot.treeId), snapshotSchema, snapshot);
}
function appendChildSession(snapshot, input) {
  const parent = snapshot.sessions[input.parentSessionId];
  if (!parent) {
    throw new Error(`Missing parent session ${input.parentSessionId}`);
  }
  const existingSession = snapshot.sessions[input.sessionId];
  if (existingSession) {
    const sameParent = existingSession.parentSessionId === input.parentSessionId;
    const sameAnchor = existingSession.anchorMessageId === input.anchorMessageId;
    if (sameParent && sameAnchor) {
      return snapshot;
    }
    throw new Error(`Session ${input.sessionId} is already attached to parent ${existingSession.parentSessionId ?? "<root>"} at anchor ${existingSession.anchorMessageId ?? "<root>"}`);
  }
  return {
    ...snapshot,
    sessions: {
      ...snapshot.sessions,
      [input.parentSessionId]: {
        ...parent,
        children: [...parent.children, input.sessionId]
      },
      [input.sessionId]: {
        sessionId: input.sessionId,
        parentSessionId: input.parentSessionId,
        anchorMessageId: input.anchorMessageId,
        children: []
      }
    }
  };
}
// src/lib/tree/route.tsx
import { effect as _$effect5 } from "@opentui/solid";
import { insert as _$insert5 } from "@opentui/solid";
import { createComponent as _$createComponent5 } from "@opentui/solid";
import { setProp as _$setProp5 } from "@opentui/solid";
import { createElement as _$createElement5 } from "@opentui/solid";
import { useKeyboard as useKeyboard2, useTerminalDimensions } from "@opentui/solid";
import { createEffect as createEffect4, createMemo as createMemo4, createResource, createSignal as createSignal3, on as on3, Show as Show4 } from "solid-js";

// src/lib/tree/bootstrap.ts
import { randomUUID as randomUUID2 } from "crypto";
var defaultDependencies = {
  storage: {
    readRegistry,
    writeRegistry,
    readSnapshot,
    writeSnapshot
  },
  createTreeId
};
function createTreeId(generateUUID = randomUUID2) {
  return `tree_${generateUUID().replaceAll("-", "")}`;
}
function createRootTreeSnapshot(treeId, sessionID) {
  return {
    version: 1,
    treeId,
    rootSessionId: sessionID,
    sessions: {
      [sessionID]: {
        sessionId: sessionID,
        parentSessionId: null,
        anchorMessageId: null,
        children: []
      }
    }
  };
}
async function bootstrapTree(input, dependencies = defaultDependencies) {
  if (!input.sessionID) {
    return {
      kind: "missing-session-context",
      projectRoot: input.projectRoot,
      storageRoot: input.storageRoot
    };
  }
  const registry2 = await dependencies.storage.readRegistry(input.storageRoot);
  const existingTreeId = registry2.sessions[input.sessionID];
  if (existingTreeId) {
    const snapshot3 = await dependencies.storage.readSnapshot(input.storageRoot, existingTreeId);
    return {
      kind: "found-tree",
      projectRoot: input.projectRoot,
      storageRoot: input.storageRoot,
      treeId: existingTreeId,
      currentSessionId: input.sessionID,
      snapshot: snapshot3
    };
  }
  const treeId = dependencies.createTreeId();
  const snapshot2 = createRootTreeSnapshot(treeId, input.sessionID);
  const nextRegistry = {
    ...createEmptyRegistry(),
    ...registry2,
    sessions: {
      ...registry2.sessions,
      [input.sessionID]: treeId
    }
  };
  await dependencies.storage.writeSnapshot(input.storageRoot, snapshot2);
  await dependencies.storage.writeRegistry(input.storageRoot, nextRegistry);
  return {
    kind: "created-tree",
    projectRoot: input.projectRoot,
    storageRoot: input.storageRoot,
    treeId,
    currentSessionId: input.sessionID,
    snapshot: snapshot2
  };
}

// src/lib/tree/branch.ts
function isTreeBranchForkAction(action) {
  return action.kind === "fork";
}
function planTreeBranchAction(input) {
  const row = input.row;
  if (!row) {
    return {
      kind: "show-notice",
      message: "Select a message row first.",
      variant: "info"
    };
  }
  if (row.kind === "session") {
    if (row.isDeleted) {
      return {
        kind: "noop"
      };
    }
    return {
      kind: "switch-session",
      sessionId: row.sessionId
    };
  }
  const transcript = input.transcripts[row.sessionId];
  const record = transcript?.messageById.get(row.messageId);
  if (!record) {
    return {
      kind: "show-notice",
      message: `Message ${row.messageId} is unavailable.`,
      variant: "error"
    };
  }
  if (row.role === "user") {
    return {
      kind: "fork",
      plan: {
        sessionId: row.sessionId,
        anchorMessageId: row.messageId,
        forkMessageId: row.messageId,
        appendPromptText: getMessageTextReplay(record.parts)
      }
    };
  }
  const nextRecord = getNextSessionMessageRecord(transcript, row.messageId);
  if (!nextRecord) {
    return {
      kind: "switch-session",
      sessionId: row.sessionId
    };
  }
  return {
    kind: "fork",
    plan: {
      sessionId: row.sessionId,
      anchorMessageId: row.messageId,
      forkMessageId: nextRecord.info.id
    }
  };
}
function collectTreeBranchSummarySlice(input) {
  const row = input.row;
  if (!row) {
    throw new Error("Select a message row first.");
  }
  if (row.kind !== "message") {
    throw new Error("Select a message row to summarize.");
  }
  const transcript = input.transcripts[row.sessionId];
  if (!transcript || transcript.status === "deleted") {
    throw new Error(`Session ${row.sessionId} is unavailable.`);
  }
  const startIndex = transcript.messageIndexById.get(row.messageId);
  if (startIndex === undefined) {
    throw new Error(`Message ${row.messageId} is unavailable.`);
  }
  return {
    sessionId: row.sessionId,
    startMessageId: row.messageId,
    messages: transcript.messages.slice(startIndex)
  };
}
function getNextSessionMessageRecord(transcript, messageId) {
  if (!transcript)
    return;
  const index = transcript.messageIndexById.get(messageId);
  if (index === undefined)
    return;
  return transcript.messages[index + 1];
}

// src/lib/tree/components/tree-route-content.tsx
import { createComponent as _$createComponent2 } from "@opentui/solid";
import { insert as _$insert2 } from "@opentui/solid";
import { effect as _$effect2 } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode2 } from "@opentui/solid";
import { setProp as _$setProp2 } from "@opentui/solid";
import { createElement as _$createElement2 } from "@opentui/solid";
import { Show } from "solid-js";

// src/lib/tree/components/tree-view.tsx
import { effect as _$effect } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";
import { createEffect, createMemo, For, on, onCleanup, onMount } from "solid-js";

// src/lib/tree/layout.ts
var TREE_ROUTE_HORIZONTAL_PADDING = 2;
var INDENT_UNIT = "  ";
var GUIDE_MARKER = "\u2503";
var SESSION_PREFIX = "SESSION";
var CURRENT_SESSION_SUFFIX = " [CURRENT]";
var DELETED_SESSION_SUFFIX = " [DELETED]";
function getTreeContentWidth(viewportWidth) {
  return Math.max(1, viewportWidth - TREE_ROUTE_HORIZONTAL_PADDING);
}
function formatTreeRowParts(input) {
  const width = Math.max(1, input.width);
  const prefix = formatRowPrefix(input.row.depth, input.selected, input.current);
  if (input.row.kind === "session") {
    const suffix = formatSessionSuffix(input.row, input.current);
    const label2 = `${SESSION_PREFIX}${suffix}:`;
    const titleWidth = Math.max(0, width - prefix.length - label2.length - 1);
    const title = truncateToWidth(input.row.title, titleWidth);
    const body2 = title ? `${label2} ${title}` : label2;
    return {
      prefix,
      body: truncateToWidth(body2, Math.max(0, width - prefix.length))
    };
  }
  const label = `${input.row.role}: `;
  const previewWidth = Math.max(0, width - prefix.length - label.length);
  const preview = truncateToWidth(input.row.preview, previewWidth);
  const body = preview ? `${label}${preview}` : label.trimEnd();
  return {
    prefix,
    body: truncateToWidth(body, Math.max(0, width - prefix.length))
  };
}
function formatSessionSuffix(row, current) {
  const suffixes = [];
  if (row.isDeleted) {
    suffixes.push(DELETED_SESSION_SUFFIX);
  }
  if (current) {
    suffixes.push(CURRENT_SESSION_SUFFIX);
  }
  return suffixes.join("");
}
function formatRowPrefix(depth, selected, current) {
  const indent = INDENT_UNIT.repeat(depth);
  const selectedMarker = selected ? "\u203A" : " ";
  const currentMarker = current && !selected ? GUIDE_MARKER : " ";
  return `${selectedMarker}${currentMarker} ${indent}`;
}
function truncateToWidth(text, width) {
  if (width <= 0)
    return "";
  if (text.length <= width)
    return text;
  if (width === 1)
    return "\u2026";
  return `${text.slice(0, width - 1)}\u2026`;
}

// src/lib/tree/theme.ts
function mapTreeTheme(theme) {
  return {
    screenBackground: theme.background,
    panelBackground: theme.background,
    panelBorder: theme.borderSubtle,
    selectedRowBackground: theme.backgroundElement,
    selectedRowBorder: theme.borderActive,
    guideText: theme.primary,
    helpText: theme.textMuted,
    helpKey: theme.text,
    loadingText: theme.info,
    emptyText: theme.textMuted,
    errorText: theme.error,
    noticeText: theme.warning,
    branchingText: theme.accent
  };
}
function getTreeRowForeground(theme, row, _state) {
  if (row.kind === "session") {
    if (row.isDeleted)
      return theme.error;
    return theme.secondary;
  }
  if (row.role === "assistant") {
    return theme.textMuted;
  }
  if (row.role === "user") {
    return theme.primary;
  }
  return theme.text;
}
function getTreeRowBackground(theme, state) {
  if (!state.selected)
    return;
  return theme.backgroundElement;
}
function getTreeRowBorder(theme, state) {
  if (!state.selected)
    return;
  return theme.borderActive;
}

// src/lib/tree/components/tree-view.tsx
function TreeView(props) {
  let scroll;
  let pendingScrollTimeout;
  const handleFocused = () => props.onFocusChange?.(true);
  const handleBlurred = () => props.onFocusChange?.(false);
  const renderedRows = createMemo(() => {
    const theme = props.theme();
    const guideColor = mapTreeTheme(theme).guideText;
    return props.rows.map((row, index) => {
      const selected = props.selectedIndex === index;
      const current = row.sessionId === row.currentSessionId;
      return {
        id: row.id,
        selected,
        backgroundColor: getTreeRowBackground(theme, {
          selected,
          current
        }),
        borderColor: getTreeRowBorder(theme, {
          selected,
          current
        }),
        guideColor,
        foregroundColor: getTreeRowForeground(theme, row, {
          selected,
          current
        }),
        attributes: selected || current ? TextAttributes.BOLD : undefined,
        parts: formatTreeRowParts({
          row,
          selected,
          current,
          width: props.width
        })
      };
    });
  });
  const selectedRowId = createMemo(() => {
    const index = props.selectedIndex;
    if (index === undefined)
      return;
    return renderedRows()[index]?.id;
  });
  const clearPendingScroll = () => {
    if (pendingScrollTimeout === undefined)
      return;
    clearTimeout(pendingScrollTimeout);
    pendingScrollTimeout = undefined;
  };
  const scheduleScrollIntoView = (rowId) => {
    clearPendingScroll();
    const scrollIntoViewWhenReady = () => {
      pendingScrollTimeout = undefined;
      if (!scroll)
        return;
      const child = scroll.content.findDescendantById(rowId);
      if (!child || scroll.viewport.height <= 0 || child.height <= 0) {
        pendingScrollTimeout = setTimeout(scrollIntoViewWhenReady, 0);
        return;
      }
      scroll.scrollChildIntoView(rowId);
    };
    pendingScrollTimeout = setTimeout(scrollIntoViewWhenReady, 0);
  };
  onMount(() => {
    scroll?.on("focused", handleFocused);
    scroll?.on("blurred", handleBlurred);
    if (props.autoFocus) {
      scroll?.focus();
    }
    const rowId = selectedRowId();
    if (!rowId)
      return;
    scheduleScrollIntoView(rowId);
  });
  createEffect(on(selectedRowId, (rowId) => {
    if (!rowId)
      return;
    scheduleScrollIntoView(rowId);
  }, {
    defer: true
  }));
  onCleanup(() => {
    clearPendingScroll();
    props.onFocusChange?.(false);
    scroll?.off("focused", handleFocused);
    scroll?.off("blurred", handleBlurred);
  });
  return (() => {
    var _el$ = _$createElement("scrollbox"), _el$2 = _$createElement("box");
    _$insertNode(_el$, _el$2);
    _$use((renderable) => scroll = renderable, _el$);
    _$setProp(_el$, "flexGrow", 1);
    _$setProp(_el$, "minHeight", 0);
    _$setProp(_el$, "width", "100%");
    _$setProp(_el$, "focusable", true);
    _$setProp(_el$, "scrollbarOptions", {
      visible: false
    });
    _$setProp(_el$2, "flexDirection", "column");
    _$setProp(_el$2, "gap", 0);
    _$setProp(_el$2, "width", "100%");
    _$insert(_el$2, _$createComponent(For, {
      get each() {
        return renderedRows();
      },
      children: (row) => (() => {
        var _el$3 = _$createElement("box"), _el$4 = _$createElement("text"), _el$5 = _$createElement("text");
        _$insertNode(_el$3, _el$4);
        _$insertNode(_el$3, _el$5);
        _$setProp(_el$3, "width", "100%");
        _$setProp(_el$3, "flexDirection", "row");
        _$setProp(_el$4, "wrapMode", "none");
        _$insert(_el$4, () => row.parts.prefix);
        _$setProp(_el$5, "wrapMode", "none");
        _$insert(_el$5, () => row.parts.body);
        _$effect((_p$) => {
          var { id: _v$, backgroundColor: _v$2 } = row, _v$3 = row.selected ? ["left"] : undefined, _v$4 = row.borderColor, _v$5 = row.attributes, _v$6 = row.guideColor, _v$7 = row.attributes, _v$8 = row.foregroundColor;
          _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "id", _v$, _p$.e));
          _v$2 !== _p$.t && (_p$.t = _$setProp(_el$3, "backgroundColor", _v$2, _p$.t));
          _v$3 !== _p$.a && (_p$.a = _$setProp(_el$3, "border", _v$3, _p$.a));
          _v$4 !== _p$.o && (_p$.o = _$setProp(_el$3, "borderColor", _v$4, _p$.o));
          _v$5 !== _p$.i && (_p$.i = _$setProp(_el$4, "attributes", _v$5, _p$.i));
          _v$6 !== _p$.n && (_p$.n = _$setProp(_el$4, "fg", _v$6, _p$.n));
          _v$7 !== _p$.s && (_p$.s = _$setProp(_el$5, "attributes", _v$7, _p$.s));
          _v$8 !== _p$.h && (_p$.h = _$setProp(_el$5, "fg", _v$8, _p$.h));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined,
          o: undefined,
          i: undefined,
          n: undefined,
          s: undefined,
          h: undefined
        });
        return _el$3;
      })()
    }));
    return _el$;
  })();
}

// src/lib/tree/components/tree-route-content.tsx
function resolveTreeRouteBodyState(input) {
  if (!input.projectRoot) {
    return {
      kind: "status",
      tone: "notice",
      message: "Project root unavailable."
    };
  }
  if (input.bootstrapLoading) {
    return {
      kind: "status",
      tone: "loading",
      message: "Loading tree ownership..."
    };
  }
  if (input.bootstrapErrorMessage) {
    return {
      kind: "status",
      tone: "error",
      message: `Bootstrap error: ${input.bootstrapErrorMessage}`
    };
  }
  if (input.missingSessionContext) {
    return {
      kind: "status",
      tone: "notice",
      message: "Open /tree from session route."
    };
  }
  if (input.projectedLoading) {
    return {
      kind: "status",
      tone: "loading",
      message: "Loading session messages..."
    };
  }
  if (input.projectedErrorMessage) {
    return {
      kind: "status",
      tone: "error",
      message: `Projection error: ${input.projectedErrorMessage}`
    };
  }
  if (input.rows.length === 0) {
    return {
      kind: "status",
      tone: "empty",
      message: "Tree empty."
    };
  }
  return {
    kind: "ready",
    rows: input.rows
  };
}
function TreeRouteHelpPanel(props) {
  return (() => {
    var _el$ = _$createElement2("box"), _el$2 = _$createElement2("text"), _el$3 = _$createElement2("span"), _el$5 = _$createTextNode(` move \u2022 `), _el$7 = _$createElement2("span"), _el$9 = _$createTextNode(` move \u2022 `), _el$1 = _$createElement2("span"), _el$11 = _$createTextNode(` branch \u2022 `), _el$13 = _$createElement2("span"), _el$15 = _$createTextNode(` back`);
    _$insertNode2(_el$, _el$2);
    _$setProp2(_el$, "flexDirection", "row");
    _$setProp2(_el$, "gap", 1);
    _$setProp2(_el$, "paddingLeft", 1);
    _$setProp2(_el$, "paddingRight", 1);
    _$setProp2(_el$, "paddingTop", 1);
    _$setProp2(_el$, "paddingBottom", 2);
    _$insertNode2(_el$2, _el$3);
    _$insertNode2(_el$2, _el$5);
    _$insertNode2(_el$2, _el$7);
    _$insertNode2(_el$2, _el$9);
    _$insertNode2(_el$2, _el$1);
    _$insertNode2(_el$2, _el$11);
    _$insertNode2(_el$2, _el$13);
    _$insertNode2(_el$2, _el$15);
    _$insertNode2(_el$3, _$createTextNode(`\u2191/\u2193`));
    _$insertNode2(_el$7, _$createTextNode(`j/k`));
    _$insertNode2(_el$1, _$createTextNode(`Enter`));
    _$insertNode2(_el$13, _$createTextNode(`esc`));
    _$effect2((_p$) => {
      var _v$ = props.palette.panelBackground, _v$2 = props.busy ? props.palette.branchingText : props.palette.helpText, _v$3 = {
        fg: props.palette.helpKey
      }, _v$4 = {
        fg: props.palette.helpKey
      }, _v$5 = {
        fg: props.palette.helpKey
      }, _v$6 = {
        fg: props.palette.helpKey
      };
      _v$ !== _p$.e && (_p$.e = _$setProp2(_el$, "backgroundColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp2(_el$2, "fg", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp2(_el$3, "style", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp2(_el$7, "style", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp2(_el$1, "style", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp2(_el$13, "style", _v$6, _p$.n));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined
    });
    return _el$;
  })();
}
function TreeRouteStatusPanel(props) {
  const foreground = () => {
    switch (props.tone) {
      case "loading":
        return props.palette.loadingText;
      case "error":
        return props.palette.errorText;
      case "empty":
        return props.palette.emptyText;
      case "notice":
        return props.palette.noticeText;
    }
  };
  return (() => {
    var _el$16 = _$createElement2("box"), _el$17 = _$createElement2("text");
    _$insertNode2(_el$16, _el$17);
    _$setProp2(_el$16, "paddingLeft", 1);
    _$setProp2(_el$16, "paddingRight", 1);
    _$setProp2(_el$16, "paddingTop", 0);
    _$setProp2(_el$16, "paddingBottom", 1);
    _$insert2(_el$17, () => props.message);
    _$effect2((_p$) => {
      var _v$7 = props.palette.panelBackground, _v$8 = foreground();
      _v$7 !== _p$.e && (_p$.e = _$setProp2(_el$16, "backgroundColor", _v$7, _p$.e));
      _v$8 !== _p$.t && (_p$.t = _$setProp2(_el$17, "fg", _v$8, _p$.t));
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$16;
  })();
}
function TreeRouteBody(props) {
  return _$createComponent2(Show, {
    get when() {
      return props.state;
    },
    keyed: true,
    children: (state) => state.kind === "status" ? _$createComponent2(TreeRouteStatusPanel, {
      get palette() {
        return props.palette;
      },
      get tone() {
        return state.tone;
      },
      get message() {
        return state.message;
      }
    }) : (() => {
      var _el$18 = _$createElement2("box");
      _$setProp2(_el$18, "flexDirection", "column");
      _$setProp2(_el$18, "flexGrow", 1);
      _$setProp2(_el$18, "minHeight", 0);
      _$insert2(_el$18, _$createComponent2(TreeView, {
        get rows() {
          return state.rows;
        },
        get selectedIndex() {
          return props.selectedIndex;
        },
        get width() {
          return props.treeWidth;
        },
        get theme() {
          return props.theme;
        },
        autoFocus: true,
        get onFocusChange() {
          return props.onFocusChange;
        }
      }));
      _$effect2((_$p) => _$setProp2(_el$18, "backgroundColor", props.palette.panelBackground, _$p));
      return _el$18;
    })()
  });
}

// src/lib/tree/flatten.ts
function buildFlatRows(root, currentSessionId) {
  const rows = [];
  const lastRowIndexBySessionId = {};
  flattenSession(rows, lastRowIndexBySessionId, root, currentSessionId, 0);
  return {
    rows,
    lastRowIndexBySessionId
  };
}
function flattenSession(rows, lastRowIndexBySessionId, session, currentSessionId, depth) {
  pushRow(rows, lastRowIndexBySessionId, {
    kind: "session",
    id: `session:${session.sessionId}`,
    depth,
    sessionId: session.sessionId,
    currentSessionId,
    title: session.sessionId,
    isDeleted: session.status === "deleted"
  });
  for (const childSession of session.childSessions) {
    flattenSession(rows, lastRowIndexBySessionId, childSession, currentSessionId, depth + 1);
  }
  for (const message of session.messages) {
    pushRow(rows, lastRowIndexBySessionId, {
      kind: "message",
      id: `message:${message.sessionId}:${message.messageId}`,
      depth: depth + 1,
      sessionId: message.sessionId,
      currentSessionId,
      messageId: message.messageId,
      role: message.record.info.role,
      preview: getMessagePreview(message)
    });
    for (const childSession of message.childSessions) {
      flattenSession(rows, lastRowIndexBySessionId, childSession, currentSessionId, depth + 2);
    }
  }
}
function pushRow(rows, lastRowIndexBySessionId, row) {
  rows.push(row);
  lastRowIndexBySessionId[row.sessionId] = rows.length - 1;
}
function getMessagePreview(message) {
  const previewParts = collectPreviewParts(message.record.parts);
  if (previewParts.textPart) {
    return normalizePreviewText(previewParts.textPart.text);
  }
  if (message.record.info.role === "assistant") {
    if (previewParts.toolPart) {
      return normalizePreviewText(formatToolPreview(previewParts.toolPart));
    }
    if (previewParts.reasoningPart) {
      return normalizePreviewText(`reasoning: ${previewParts.reasoningPart.text}`);
    }
  }
  if (previewParts.fallbackPartTypes.length > 0) {
    return `[${previewParts.fallbackPartTypes.join(", ")}]`;
  }
  return "(no content)";
}
function collectPreviewParts(parts) {
  const fallbackPartTypes = [];
  const seenFallbackPartTypes = new Set;
  let textPart;
  let toolPart;
  let reasoningPart;
  for (const part of parts) {
    if (part.type === "text" && !part.synthetic && !part.ignored) {
      textPart ??= part;
    } else if (part.type === "tool") {
      toolPart ??= part;
    } else if (part.type === "reasoning" && part.text.trim().length > 0) {
      reasoningPart ??= part;
    }
    if (part.type === "step-start" || part.type === "step-finish") {
      continue;
    }
    if (seenFallbackPartTypes.has(part.type)) {
      continue;
    }
    seenFallbackPartTypes.add(part.type);
    fallbackPartTypes.push(part.type);
  }
  return {
    textPart,
    toolPart,
    reasoningPart,
    fallbackPartTypes
  };
}
function formatToolPreview(part) {
  const inputPreview = getToolInputPreview(part.state.input);
  if (!inputPreview) {
    return `tool:${part.tool}`;
  }
  return `tool:${part.tool} ${inputPreview}`;
}
function getToolInputPreview(input) {
  const keys = Object.keys(input);
  if (keys.length === 0)
    return;
  const firstKey = keys[0];
  if (!firstKey)
    return;
  const value = input[firstKey];
  const valueText = formatToolInputValue(value);
  if (!valueText)
    return firstKey;
  return `${firstKey}=${valueText}`;
}
function formatToolInputValue(value) {
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value === null)
    return "null";
  if (Array.isArray(value) || typeof value === "object") {
    const json = JSON.stringify(value);
    return json ?? undefined;
  }
  return;
}
function normalizePreviewText(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized || "(empty text)";
}

// src/lib/tree/navigation.ts
function getInitialSelectedRowIndex(flatTree, currentSessionId) {
  if (flatTree.rows.length === 0)
    return;
  return flatTree.lastRowIndexBySessionId[currentSessionId] ?? 0;
}
function moveSelectionUp(rows, currentIndex) {
  return moveSelection(rows, currentIndex, -1);
}
function moveSelectionDown(rows, currentIndex) {
  return moveSelection(rows, currentIndex, 1);
}
function moveSelection(rows, currentIndex, delta) {
  if (rows.length === 0)
    return;
  if (currentIndex === undefined) {
    return delta < 0 ? rows.length - 1 : 0;
  }
  return clampIndex(currentIndex + delta, rows.length);
}
function clampIndex(index, length) {
  if (length <= 1)
    return 0;
  if (index < 0)
    return 0;
  if (index >= length)
    return length - 1;
  return index;
}

// src/lib/tree/project.ts
function resolveProjectRoot(path) {
  const worktree = path.worktree.trim();
  if (worktree)
    return worktree;
  const directory = path.directory.trim();
  return directory || undefined;
}
function projectSessionTree(snapshot2, transcripts) {
  return projectSessionNode(snapshot2, transcripts, snapshot2.rootSessionId);
}
function projectSessionNode(snapshot2, transcripts, sessionId) {
  const snapshotSession = snapshot2.sessions[sessionId];
  if (!snapshotSession) {
    throw new Error(`Missing snapshot session ${sessionId}`);
  }
  const transcript = transcripts[sessionId];
  if (!transcript) {
    throw new Error(`Missing transcript for session ${sessionId}`);
  }
  if (transcript.status === "deleted") {
    return {
      kind: "session",
      sessionId,
      status: "deleted",
      childSessions: snapshotSession.children.map((childSessionId) => projectSessionNode(snapshot2, transcripts, childSessionId)),
      messages: []
    };
  }
  const hiddenPrefixCount = getHiddenPrefixCount(snapshot2, transcripts, sessionId);
  const childrenByAnchor = getChildrenByAnchor(snapshot2, transcript, snapshotSession.children, sessionId);
  const messages = transcript.messages.slice(hiddenPrefixCount).map((record) => {
    const anchoredChildIds = childrenByAnchor.get(record.info.id) ?? [];
    return {
      kind: "message",
      sessionId,
      messageId: record.info.id,
      record,
      childSessions: anchoredChildIds.map((childSessionId) => projectSessionNode(snapshot2, transcripts, childSessionId))
    };
  });
  return {
    kind: "session",
    sessionId,
    status: "available",
    childSessions: [],
    messages
  };
}
function getHiddenPrefixCount(snapshot2, transcripts, sessionId) {
  const snapshotSession = snapshot2.sessions[sessionId];
  if (!snapshotSession) {
    throw new Error(`Missing snapshot session ${sessionId}`);
  }
  if (!snapshotSession.parentSessionId || !snapshotSession.anchorMessageId) {
    return 0;
  }
  const parentTranscript = transcripts[snapshotSession.parentSessionId];
  if (!parentTranscript) {
    throw new Error(`Missing transcript for parent session ${snapshotSession.parentSessionId}`);
  }
  if (parentTranscript.status === "deleted") {
    return 0;
  }
  return getInheritedPrefixCount(parentTranscript, snapshotSession.anchorMessageId);
}
function getInheritedPrefixCount(parentTranscript, anchorMessageId) {
  const anchorIndex = parentTranscript.messageIndexById.get(anchorMessageId);
  if (anchorIndex === undefined) {
    throw new Error(`Anchor message ${anchorMessageId} not found in parent session ${parentTranscript.sessionId}`);
  }
  const anchorRecord = parentTranscript.messages[anchorIndex];
  if (!anchorRecord) {
    throw new Error(`Anchor message ${anchorMessageId} not found in parent session ${parentTranscript.sessionId}`);
  }
  return anchorRecord.info.role === "assistant" ? anchorIndex + 1 : anchorIndex;
}
function getChildrenByAnchor(snapshot2, transcript, childSessionIds, sessionId) {
  const childrenByAnchor = new Map;
  for (const childSessionId of childSessionIds) {
    const childSession = snapshot2.sessions[childSessionId];
    if (!childSession) {
      throw new Error(`Missing snapshot child session ${childSessionId}`);
    }
    const anchorMessageId = childSession.anchorMessageId;
    if (!anchorMessageId) {
      throw new Error(`Missing anchorMessageId for child session ${childSessionId}`);
    }
    if (!transcript.messageById.has(anchorMessageId)) {
      throw new Error(`Anchor message ${anchorMessageId} for child session ${childSessionId} not found in session ${sessionId}`);
    }
    const anchoredChildren = childrenByAnchor.get(anchorMessageId);
    if (anchoredChildren) {
      anchoredChildren.push(childSessionId);
      continue;
    }
    childrenByAnchor.set(anchorMessageId, [childSessionId]);
  }
  return childrenByAnchor;
}

// src/lib/tree/route-branching.ts
import {
  createComponent,
  createEffect as createEffect3,
  createMemo as createMemo3,
  createSignal as createSignal2,
  on as on2
} from "solid-js";

// src/lib/opencode/summary.ts
var TREE_BRANCH_SUMMARIZATION_SYSTEM_PROMPT = `You are a context summarization assistant. Your task is to read a conversation between a user and an AI coding assistant, then produce a structured summary following the exact format specified.

Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured summary.`;
var TREE_BRANCH_SUMMARY_INSTRUCTIONS = `Create a structured summary of this conversation branch for context when returning later.

Use this EXACT format:

## Goal
[What was the user trying to accomplish in this branch?]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Work that was started but not finished]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [What should happen next to continue this work]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;
var TREE_BRANCH_SUMMARY_PREAMBLE = `The user explored a different conversation branch before returning here.
Summary of that exploration:

`;
function buildTreeBranchSummaryInstructions(customInstructions) {
  const normalizedCustomInstructions = customInstructions?.trim();
  if (!normalizedCustomInstructions) {
    return TREE_BRANCH_SUMMARY_INSTRUCTIONS;
  }
  return `${TREE_BRANCH_SUMMARY_INSTRUCTIONS}

Additional focus: ${normalizedCustomInstructions}`;
}
function buildTreeBranchSummaryPrompt(input) {
  return `<conversation>
${input.conversation}
</conversation>

${buildTreeBranchSummaryInstructions(input.customInstructions)}`;
}
function buildTreeBranchSummaryMessage(summary) {
  const normalizedSummary = summary.trim();
  return `${TREE_BRANCH_SUMMARY_PREAMBLE}${normalizedSummary}`;
}
async function generateTreeBranchSummary(input, dependencies) {
  let helperSessionId;
  let summary;
  let generationError;
  let getAbortPromise = () => {
    return;
  };
  let detachAbortListener = () => {};
  try {
    const helperSession = input.signal ? await dependencies.client.session.create({
      directory: input.projectRoot,
      title: "Tree branch summary"
    }, { signal: input.signal }) : await dependencies.client.session.create({
      directory: input.projectRoot,
      title: "Tree branch summary"
    });
    if (helperSession.error) {
      throw createSessionSummaryError("create summary helper session", helperSession.error, helperSession.response?.status);
    }
    helperSessionId = helperSession.data?.id;
    if (!helperSessionId) {
      throw new Error("Summary helper session creation did not return a session ID");
    }
    ({ getAbortPromise, detachAbortListener } = trackSummaryAbort({
      signal: input.signal,
      sessionId: helperSessionId,
      projectRoot: input.projectRoot,
      client: dependencies.client
    }));
    const promptParameters = {
      sessionID: helperSessionId,
      directory: input.projectRoot,
      system: TREE_BRANCH_SUMMARIZATION_SYSTEM_PROMPT,
      agent: input.agent,
      model: input.model,
      parts: [
        {
          type: "text",
          text: buildTreeBranchSummaryPrompt({
            conversation: input.conversation,
            customInstructions: input.customInstructions
          })
        }
      ]
    };
    const promptResult = await promptSummaryWithCancellation({
      signal: input.signal,
      getAbortPromise,
      prompt: () => input.signal ? dependencies.client.session.prompt(promptParameters, { signal: input.signal }) : dependencies.client.session.prompt(promptParameters)
    });
    if (promptResult.error) {
      throw createSessionSummaryError("generate branch summary", promptResult.error, promptResult.response?.status);
    }
    summary = extractSummaryText(promptResult.data?.parts ?? []);
    if (!summary) {
      throw new Error("Summary helper session returned no text");
    }
  } catch (error) {
    generationError = toSummaryGenerationError(error);
  } finally {
    detachAbortListener();
  }
  let cleanupError;
  if (helperSessionId) {
    try {
      const abortPromise = getAbortPromise();
      if (abortPromise) {
        await abortPromise;
      }
      await deleteSummaryHelperSession(helperSessionId, input.projectRoot, dependencies.client);
    } catch (error) {
      cleanupError = toError(error);
    }
  }
  if (generationError && cleanupError) {
    throw new Error(`${generationError.message}; cleanup failed: ${cleanupError.message}`);
  }
  if (cleanupError) {
    throw cleanupError;
  }
  if (generationError) {
    throw generationError;
  }
  if (!summary) {
    throw new Error("Summary helper session returned no text");
  }
  return summary;
}
function extractSummaryText(parts) {
  const text = parts.reduce((result, part) => {
    if (part.type !== "text" || part.synthetic || part.ignored)
      return result;
    return result + part.text;
  }, "");
  const normalized = text.trim();
  return normalized.length > 0 ? normalized : undefined;
}
function createSessionSummaryError(action, error, statusCode) {
  const prefix = `Failed to ${action}`;
  const message = getApiErrorMessage(error);
  if (statusCode !== undefined && message) {
    return new Error(`${prefix} (${statusCode}): ${message}`);
  }
  if (statusCode !== undefined) {
    return new Error(`${prefix} (${statusCode})`);
  }
  if (message) {
    return new Error(`${prefix}: ${message}`);
  }
  return new Error(prefix);
}
async function deleteSummaryHelperSession(sessionId, projectRoot, client) {
  const deleteResult = await client.session.delete({
    sessionID: sessionId,
    directory: projectRoot
  });
  if (deleteResult.error) {
    throw createSessionSummaryError("delete summary helper session", deleteResult.error, deleteResult.response?.status);
  }
  if (deleteResult.data !== true) {
    throw new Error("Summary helper session deletion did not succeed");
  }
}
function trackSummaryAbort(input) {
  if (!input.signal) {
    return {
      getAbortPromise: () => {
        return;
      },
      detachAbortListener: () => {}
    };
  }
  let abortPromise;
  const abort = () => {
    abortPromise ??= abortSummaryHelperSession(input.sessionId, input.projectRoot, input.client);
    return abortPromise;
  };
  if (input.signal.aborted) {
    abort();
    return {
      getAbortPromise: () => abortPromise,
      detachAbortListener: () => {}
    };
  }
  const onAbort = () => {
    abort();
  };
  input.signal.addEventListener("abort", onAbort, { once: true });
  return {
    getAbortPromise: () => {
      return abortPromise;
    },
    detachAbortListener: () => {
      input.signal?.removeEventListener("abort", onAbort);
    }
  };
}
async function promptSummaryWithCancellation(input) {
  const promptPromise = input.prompt();
  if (!input.signal) {
    return promptPromise;
  }
  promptPromise.catch(() => {
    return;
  });
  const result = await Promise.race([
    promptPromise,
    waitForSummaryAbort(input.signal, input.getAbortPromise)
  ]);
  if (input.signal.aborted) {
    const abortPromise = input.getAbortPromise();
    if (abortPromise) {
      await abortPromise;
    }
    throw createAbortError();
  }
  return result;
}
async function waitForSummaryAbort(signal, getAbortPromise) {
  if (signal.aborted) {
    const abortPromise2 = getAbortPromise();
    if (abortPromise2) {
      await abortPromise2;
    }
    throw createAbortError();
  }
  await new Promise((resolve) => {
    signal.addEventListener("abort", () => resolve(), { once: true });
  });
  const abortPromise = getAbortPromise();
  if (abortPromise) {
    await abortPromise;
  }
  throw createAbortError();
}
async function abortSummaryHelperSession(sessionId, projectRoot, client) {
  const abortResult = await client.session.abort({
    sessionID: sessionId,
    directory: projectRoot
  });
  if (abortResult.error) {
    throw createSessionSummaryError("abort summary helper session", abortResult.error, abortResult.response?.status);
  }
  if (abortResult.data !== true) {
    throw new Error("Summary helper session abort did not succeed");
  }
}
function getApiErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return;
}
function getErrorMessage(error) {
  if (error instanceof Error)
    return error.message;
  return String(error);
}
function toError(error) {
  if (error instanceof Error)
    return error;
  return new Error(getErrorMessage(error));
}
function toSummaryGenerationError(error) {
  if (isAbortError(error)) {
    return new Error("Summary generation cancelled.");
  }
  return toError(error);
}
function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}
function createAbortError() {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

// src/lib/opencode/branch.ts
var defaultStorage = {
  readRegistry,
  writeRegistry,
  writeSnapshot
};
async function executeTreeBranchAction(input, dependencies) {
  if (input.action.kind === "noop") {
    return;
  }
  if (input.action.kind === "show-notice") {
    await dependencies.client.tui.showToast({
      directory: input.projectRoot,
      message: input.action.message,
      variant: input.action.variant
    });
    return;
  }
  if (input.action.kind === "switch-session") {
    await dependencies.navigateToSession(input.action.sessionId);
    return;
  }
  const forked = await executeTreeForkPlan({
    plan: input.action.plan,
    projectRoot: input.projectRoot,
    storageRoot: input.storageRoot,
    snapshot: input.snapshot
  }, dependencies);
  await completeTreeForkTransition({
    forkedSessionId: forked.forkedSessionId,
    appendPromptText: forked.appendPromptText,
    projectRoot: input.projectRoot
  }, dependencies);
}
async function executeTreeForkPlan(input, dependencies) {
  const forkedSessionId = await forkTreeSession(input.plan, input.projectRoot, dependencies.client);
  await persistTreeFork(input.plan, forkedSessionId, input.snapshot, input.storageRoot, dependencies.storage ?? defaultStorage);
  return {
    forkedSessionId,
    appendPromptText: input.plan.appendPromptText
  };
}
async function executeTreeSummaryFork(input, dependencies) {
  const summaryGenerator = dependencies.generateSummary ?? generateTreeBranchSummary;
  const summary = await summaryGenerator({
    projectRoot: input.projectRoot,
    conversation: input.conversation,
    customInstructions: input.customInstructions,
    signal: input.signal
  }, { client: dependencies.client });
  const forkedSessionId = await forkTreeSession(input.plan, input.projectRoot, dependencies.client);
  try {
    await injectTreeBranchSummary(forkedSessionId, summary, input.projectRoot, dependencies.client);
    await persistTreeFork(input.plan, forkedSessionId, input.snapshot, input.storageRoot, dependencies.storage ?? defaultStorage);
  } catch (error) {
    await cleanupFailedTreeFork(forkedSessionId, input.projectRoot, dependencies.client, error);
  }
  await completeTreeForkTransition({
    forkedSessionId,
    appendPromptText: input.plan.appendPromptText,
    projectRoot: input.projectRoot
  }, dependencies);
}
async function completeTreeForkTransition(input, dependencies) {
  await dependencies.navigateToSession(input.forkedSessionId);
  if (!input.appendPromptText)
    return;
  await waitForRouteTransition();
  await dependencies.client.tui.appendPrompt({
    directory: input.projectRoot,
    text: input.appendPromptText
  });
}
function waitForRouteTransition() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
async function forkTreeSession(plan, projectRoot, client) {
  const forked = await client.session.fork({
    sessionID: plan.sessionId,
    messageID: plan.forkMessageId,
    directory: projectRoot
  });
  const forkedSessionId = forked.data?.id;
  if (!forkedSessionId) {
    throw new Error("Fork request did not return a session ID");
  }
  return forkedSessionId;
}
async function persistTreeFork(plan, forkedSessionId, snapshot2, storageRoot, storage) {
  const nextSnapshot = appendChildSession(snapshot2, {
    sessionId: forkedSessionId,
    parentSessionId: plan.sessionId,
    anchorMessageId: plan.anchorMessageId
  });
  const registry2 = await storage.readRegistry(storageRoot);
  const nextRegistry = registerSessionTree(registry2, forkedSessionId, snapshot2.treeId);
  await storage.writeSnapshot(storageRoot, nextSnapshot);
  await storage.writeRegistry(storageRoot, nextRegistry);
}
async function injectTreeBranchSummary(sessionId, summary, projectRoot, client) {
  const result = await client.session.prompt({
    sessionID: sessionId,
    directory: projectRoot,
    noReply: true,
    parts: [
      {
        type: "text",
        text: buildTreeBranchSummaryMessage(summary)
      }
    ]
  });
  if (result.error) {
    throw new Error("Failed to write summary into the new branch session");
  }
}
async function cleanupFailedTreeFork(forkedSessionId, projectRoot, client, error) {
  try {
    const result = await client.session.delete({
      sessionID: forkedSessionId,
      directory: projectRoot
    });
    if (result.error || result.data !== true) {
      throw new Error("Failed to clean up the new branch session");
    }
  } catch (cleanupError) {
    throw new Error(`${getErrorMessage2(error)}; cleanup failed: ${getErrorMessage2(cleanupError)}`);
  }
  throw toError2(error);
}
function toError2(error) {
  if (error instanceof Error)
    return error;
  return new Error(getErrorMessage2(error));
}
function getErrorMessage2(error) {
  if (error instanceof Error)
    return error.message;
  return String(error);
}

// src/lib/tree/components/branch-summary-dialog.tsx
import { use as _$use2 } from "@opentui/solid";
import { effect as _$effect4 } from "@opentui/solid";
import { insert as _$insert4 } from "@opentui/solid";
import { createComponent as _$createComponent4 } from "@opentui/solid";
import { createTextNode as _$createTextNode2 } from "@opentui/solid";
import { insertNode as _$insertNode4 } from "@opentui/solid";
import { setProp as _$setProp4 } from "@opentui/solid";
import { createElement as _$createElement4 } from "@opentui/solid";
import { TextAttributes as TextAttributes2 } from "@opentui/core";
import { useKeyboard } from "@opentui/solid";
import { createEffect as createEffect2, createMemo as createMemo2, createSignal, For as For2, onCleanup as onCleanup2, onMount as onMount2, Show as Show3 } from "solid-js";

// src/lib/components/spinner.tsx
import { insertNode as _$insertNode3 } from "@opentui/solid";
import { createComponent as _$createComponent3 } from "@opentui/solid";
import { effect as _$effect3 } from "@opentui/solid";
import { insert as _$insert3 } from "@opentui/solid";
import { setProp as _$setProp3 } from "@opentui/solid";
import { createElement as _$createElement3 } from "@opentui/solid";
import { Show as Show2 } from "solid-js";
import"opentui-spinner/solid";
var frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function Spinner(props) {
  return (() => {
    var _el$ = _$createElement3("box"), _el$2 = _$createElement3("spinner");
    _$insertNode3(_el$, _el$2);
    _$setProp3(_el$, "flexDirection", "row");
    _$setProp3(_el$, "gap", 1);
    _$setProp3(_el$2, "frames", frames);
    _$setProp3(_el$2, "interval", 80);
    _$insert3(_el$, _$createComponent3(Show2, {
      get when() {
        return props.children;
      },
      get children() {
        var _el$3 = _$createElement3("text");
        _$insert3(_el$3, () => props.children);
        _$effect3((_$p) => _$setProp3(_el$3, "fg", props.color, _$p));
        return _el$3;
      }
    }), null);
    _$effect3((_$p) => _$setProp3(_el$2, "color", props.color, _$p));
    return _el$;
  })();
}

// src/lib/tree/components/branch-summary-dialog.tsx
var branchSummaryDialogOptions = [{
  title: "No summary",
  value: "no-summary",
  description: "Create a new branch without a summary."
}, {
  title: "Summarize",
  value: "summarize",
  description: "Summarize from this point, then create a new branch."
}, {
  title: "Summarize with custom prompt",
  value: "summarize-with-custom-prompt",
  description: "Add custom instructions for summarization."
}];
function TreeBranchSummaryDialog(props) {
  const [mode, setMode] = createSignal("select");
  const [busy, setBusy] = createSignal(false);
  const [cancelRequested, setCancelRequested] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [customInstructions, setCustomInstructions] = createSignal("");
  const selectedOption = createMemo2(() => branchSummaryDialogOptions[selectedIndex()] ?? branchSummaryDialogOptions[0]);
  let disposed = false;
  let textarea;
  onMount2(() => {
    props.ui.dialog.setSize("medium");
  });
  onCleanup2(() => {
    disposed = true;
  });
  createEffect2(() => {
    const currentMode = mode();
    const isBusy = busy();
    const currentTextarea = textarea;
    if (!currentTextarea || currentTextarea.isDestroyed)
      return;
    if (currentMode !== "custom-prompt" || isBusy) {
      currentTextarea.traits = isBusy ? {
        suspend: true,
        status: "BUSY"
      } : {};
      currentTextarea.blur();
      return;
    }
    currentTextarea.traits = {
      status: "SUMMARY"
    };
    setTimeout(() => {
      if (!textarea || textarea.isDestroyed)
        return;
      textarea.focus();
      textarea.gotoLineEnd();
    }, 1);
  });
  useKeyboard((evt) => {
    if (busy()) {
      if (evt.name === "escape" || evt.ctrl && evt.name === "c") {
        evt.preventDefault();
        evt.stopPropagation();
        setCancelRequested(true);
        props.onCancelBusy();
        return;
      }
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }
    if (mode() === "custom-prompt") {
      if (evt.name === "escape" || evt.ctrl && evt.name === "c") {
        evt.preventDefault();
        evt.stopPropagation();
        setMode("select");
      }
      return;
    }
    if (evt.name === "up" || evt.name === "k") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((current) => current <= 0 ? branchSummaryDialogOptions.length - 1 : current - 1);
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((current) => (current + 1) % branchSummaryDialogOptions.length);
      return;
    }
    if (evt.name === "return") {
      evt.preventDefault();
      evt.stopPropagation();
      selectOption(selectedOption().value);
      return;
    }
    if (evt.name === "escape" || evt.ctrl && evt.name === "c") {
      evt.preventDefault();
      evt.stopPropagation();
      props.onClose();
    }
  });
  const selectOption = async (option) => {
    if (busy())
      return;
    if (option === "summarize-with-custom-prompt") {
      setMode("custom-prompt");
      return;
    }
    if (option === "no-summary") {
      props.onSelect({
        kind: "no-summary"
      });
      return;
    }
    await submitRequest({
      kind: "summarize"
    });
  };
  const submitCustomPrompt = async () => {
    if (busy())
      return;
    await submitRequest({
      kind: "summarize",
      customInstructions: normalizeCustomInstructions(customInstructions())
    });
  };
  const submitRequest = async (request) => {
    setCancelRequested(false);
    setBusy(true);
    try {
      await waitForDialogRender();
      if (cancelRequested()) {
        props.onClose();
        return;
      }
      await props.onSelect(request);
    } finally {
      if (!disposed) {
        setBusy(false);
      }
    }
  };
  return (() => {
    var _el$ = _$createElement4("box"), _el$2 = _$createElement4("box"), _el$3 = _$createElement4("text"), _el$5 = _$createElement4("text"), _el$6 = _$createTextNode2(`esc `), _el$7 = _$createElement4("span");
    _$insertNode4(_el$, _el$2);
    _$setProp4(_el$, "paddingLeft", 2);
    _$setProp4(_el$, "paddingRight", 2);
    _$setProp4(_el$, "paddingBottom", 1);
    _$setProp4(_el$, "gap", 1);
    _$insertNode4(_el$2, _el$3);
    _$insertNode4(_el$2, _el$5);
    _$setProp4(_el$2, "flexDirection", "row");
    _$setProp4(_el$2, "justifyContent", "space-between");
    _$insertNode4(_el$3, _$createTextNode2(`Create Branch`));
    _$insertNode4(_el$5, _el$6);
    _$insertNode4(_el$5, _el$7);
    _$insertNode4(_el$7, _$createTextNode2(`cancel`));
    _$insert4(_el$, _$createComponent4(Show3, {
      get when() {
        return !busy();
      },
      get fallback() {
        return (() => {
          var _el$21 = _$createElement4("box");
          _$setProp4(_el$21, "gap", 1);
          _$insert4(_el$21, _$createComponent4(Spinner, {
            get color() {
              return props.theme.textMuted;
            },
            children: "Generating branch summary..."
          }));
          return _el$21;
        })();
      },
      get children() {
        return _$createComponent4(Show3, {
          get when() {
            return mode() === "select";
          },
          get fallback() {
            return (() => {
              var _el$22 = _$createElement4("box"), _el$23 = _$createElement4("textarea");
              _$insertNode4(_el$22, _el$23);
              _$setProp4(_el$22, "gap", 1);
              _$use2((value) => {
                textarea = value;
              }, _el$23);
              _$setProp4(_el$23, "height", 3);
              _$setProp4(_el$23, "placeholder", "Add extra summary instructions...");
              _$setProp4(_el$23, "keyBindings", [{
                name: "return",
                action: "submit"
              }]);
              _$setProp4(_el$23, "onContentChange", () => {
                setCustomInstructions(textarea?.plainText ?? "");
              });
              _$setProp4(_el$23, "onSubmit", () => {
                submitCustomPrompt();
              });
              _$effect4((_p$) => {
                var _v$1 = customInstructions(), _v$10 = props.theme.textMuted, _v$11 = props.theme.text, _v$12 = props.theme.text, _v$13 = props.theme.text;
                _v$1 !== _p$.e && (_p$.e = _$setProp4(_el$23, "initialValue", _v$1, _p$.e));
                _v$10 !== _p$.t && (_p$.t = _$setProp4(_el$23, "placeholderColor", _v$10, _p$.t));
                _v$11 !== _p$.a && (_p$.a = _$setProp4(_el$23, "textColor", _v$11, _p$.a));
                _v$12 !== _p$.o && (_p$.o = _$setProp4(_el$23, "focusedTextColor", _v$12, _p$.o));
                _v$13 !== _p$.i && (_p$.i = _$setProp4(_el$23, "cursorColor", _v$13, _p$.i));
                return _p$;
              }, {
                e: undefined,
                t: undefined,
                a: undefined,
                o: undefined,
                i: undefined
              });
              return _el$22;
            })();
          },
          get children() {
            var _el$9 = _$createElement4("box");
            _$setProp4(_el$9, "flexDirection", "column");
            _$insert4(_el$9, _$createComponent4(For2, {
              each: branchSummaryDialogOptions,
              children: (option, index) => {
                const selected = () => selectedIndex() === index();
                return (() => {
                  var _el$24 = _$createElement4("box"), _el$25 = _$createElement4("text"), _el$26 = _$createElement4("text");
                  _$insertNode4(_el$24, _el$25);
                  _$insertNode4(_el$24, _el$26);
                  _$setProp4(_el$24, "flexDirection", "column");
                  _$setProp4(_el$24, "paddingLeft", 1);
                  _$setProp4(_el$24, "paddingRight", 1);
                  _$setProp4(_el$24, "paddingTop", 1);
                  _$setProp4(_el$24, "paddingBottom", 1);
                  _$insert4(_el$25, () => option.title);
                  _$insert4(_el$26, () => option.description);
                  _$effect4((_p$) => {
                    var _v$14 = selected() ? props.theme.backgroundElement : undefined, _v$15 = selected() ? props.theme.primary : props.theme.text, _v$16 = props.theme.textMuted;
                    _v$14 !== _p$.e && (_p$.e = _$setProp4(_el$24, "backgroundColor", _v$14, _p$.e));
                    _v$15 !== _p$.t && (_p$.t = _$setProp4(_el$25, "fg", _v$15, _p$.t));
                    _v$16 !== _p$.a && (_p$.a = _$setProp4(_el$26, "fg", _v$16, _p$.a));
                    return _p$;
                  }, {
                    e: undefined,
                    t: undefined,
                    a: undefined
                  });
                  return _el$24;
                })();
              }
            }));
            return _el$9;
          }
        });
      }
    }), null);
    _$insert4(_el$, _$createComponent4(Show3, {
      get when() {
        return !busy();
      },
      get children() {
        var _el$0 = _$createElement4("box");
        _$setProp4(_el$0, "paddingTop", 1);
        _$setProp4(_el$0, "flexDirection", "row");
        _$setProp4(_el$0, "gap", 2);
        _$insert4(_el$0, _$createComponent4(Show3, {
          get when() {
            return mode() === "select";
          },
          get children() {
            return [(() => {
              var _el$1 = _$createElement4("text"), _el$10 = _$createTextNode2(`enter `), _el$11 = _$createElement4("span");
              _$insertNode4(_el$1, _el$10);
              _$insertNode4(_el$1, _el$11);
              _$insertNode4(_el$11, _$createTextNode2(`select`));
              _$effect4((_p$) => {
                var _v$ = props.theme.text, _v$2 = {
                  fg: props.theme.textMuted
                };
                _v$ !== _p$.e && (_p$.e = _$setProp4(_el$1, "fg", _v$, _p$.e));
                _v$2 !== _p$.t && (_p$.t = _$setProp4(_el$11, "style", _v$2, _p$.t));
                return _p$;
              }, {
                e: undefined,
                t: undefined
              });
              return _el$1;
            })(), (() => {
              var _el$13 = _$createElement4("text"), _el$14 = _$createTextNode2(`j/k `), _el$15 = _$createElement4("span");
              _$insertNode4(_el$13, _el$14);
              _$insertNode4(_el$13, _el$15);
              _$insertNode4(_el$15, _$createTextNode2(`move`));
              _$effect4((_p$) => {
                var _v$3 = props.theme.text, _v$4 = {
                  fg: props.theme.textMuted
                };
                _v$3 !== _p$.e && (_p$.e = _$setProp4(_el$13, "fg", _v$3, _p$.e));
                _v$4 !== _p$.t && (_p$.t = _$setProp4(_el$15, "style", _v$4, _p$.t));
                return _p$;
              }, {
                e: undefined,
                t: undefined
              });
              return _el$13;
            })()];
          }
        }), null);
        _$insert4(_el$0, _$createComponent4(Show3, {
          get when() {
            return mode() === "custom-prompt";
          },
          get children() {
            var _el$17 = _$createElement4("text"), _el$18 = _$createTextNode2(`enter `), _el$19 = _$createElement4("span");
            _$insertNode4(_el$17, _el$18);
            _$insertNode4(_el$17, _el$19);
            _$insertNode4(_el$19, _$createTextNode2(`submit`));
            _$effect4((_p$) => {
              var _v$5 = props.theme.text, _v$6 = {
                fg: props.theme.textMuted
              };
              _v$5 !== _p$.e && (_p$.e = _$setProp4(_el$17, "fg", _v$5, _p$.e));
              _v$6 !== _p$.t && (_p$.t = _$setProp4(_el$19, "style", _v$6, _p$.t));
              return _p$;
            }, {
              e: undefined,
              t: undefined
            });
            return _el$17;
          }
        }), null);
        return _el$0;
      }
    }), null);
    _$effect4((_p$) => {
      var _v$7 = TextAttributes2.BOLD, _v$8 = props.theme.text, _v$9 = props.theme.text, _v$0 = {
        fg: props.theme.textMuted
      };
      _v$7 !== _p$.e && (_p$.e = _$setProp4(_el$3, "attributes", _v$7, _p$.e));
      _v$8 !== _p$.t && (_p$.t = _$setProp4(_el$3, "fg", _v$8, _p$.t));
      _v$9 !== _p$.a && (_p$.a = _$setProp4(_el$5, "fg", _v$9, _p$.a));
      _v$0 !== _p$.o && (_p$.o = _$setProp4(_el$7, "style", _v$0, _p$.o));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$;
  })();
}
function waitForDialogRender() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1);
  });
}
function normalizeCustomInstructions(value) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

// src/lib/tree/route-branching.ts
function createTreeRouteBranchController(input) {
  const [busyState, setBusyState] = createSignal2();
  const [actionErrorMessage, setActionErrorMessage] = createSignal2();
  const [summaryDialogAction, setSummaryDialogAction] = createSignal2();
  const busy = createMemo3(() => busyState() !== undefined);
  const cancelActiveSummary = () => {
    const currentBusyState = busyState();
    if (currentBusyState?.kind !== "summarizing")
      return;
    currentBusyState.controller.abort();
  };
  const closeSummaryDialog = () => {
    setSummaryDialogAction(undefined);
    if (input.ui.dialog.open) {
      input.ui.dialog.clear();
    }
  };
  const runTreeBranchAction = (action) => {
    const bootstrapResult = input.bootstrap();
    if (!bootstrapResult || bootstrapResult.kind === "missing-session-context")
      return;
    setActionErrorMessage(undefined);
    setBusyState({ kind: "branching" });
    executeTreeBranchAction({
      action,
      projectRoot: bootstrapResult.projectRoot,
      storageRoot: bootstrapResult.storageRoot,
      snapshot: bootstrapResult.snapshot
    }, {
      client: input.client,
      navigateToSession: input.navigateToSession
    }).catch((error) => {
      setActionErrorMessage(error instanceof Error ? error.message : String(error));
    }).finally(() => {
      setBusyState(undefined);
    });
  };
  const runTreeSummaryBranchAction = async (action, request) => {
    const bootstrapResult = input.bootstrap();
    const treeData = input.projectedTreeData();
    if (!bootstrapResult || bootstrapResult.kind === "missing-session-context" || !treeData)
      return;
    const controller = new AbortController;
    setActionErrorMessage(undefined);
    setBusyState({ kind: "summarizing", controller });
    try {
      const summarySlice = collectTreeBranchSummarySlice({
        row: input.selectedRow(),
        transcripts: treeData.transcripts
      });
      const conversation = serializeSessionMessageRecordsForSummary(summarySlice.messages);
      await executeTreeSummaryFork({
        plan: action.plan,
        projectRoot: bootstrapResult.projectRoot,
        storageRoot: bootstrapResult.storageRoot,
        snapshot: bootstrapResult.snapshot,
        conversation,
        customInstructions: request.customInstructions,
        signal: controller.signal
      }, {
        client: input.client,
        navigateToSession: input.navigateToSession
      });
      closeSummaryDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      closeSummaryDialog();
      if (message === "Summary generation cancelled.") {
        return;
      }
      setActionErrorMessage(`Summary generation failed: ${message}`);
    } finally {
      setBusyState(undefined);
    }
  };
  const handleBranchSummaryRequest = (action, request) => {
    if (request.kind === "no-summary") {
      closeSummaryDialog();
      runTreeBranchAction(action);
      return;
    }
    return runTreeSummaryBranchAction(action, request);
  };
  const openBranchSummaryDialog = (action) => {
    setActionErrorMessage(undefined);
    setSummaryDialogAction(action);
  };
  createEffect3(on2(summaryDialogAction, (nextDialogAction) => {
    if (!nextDialogAction)
      return;
    input.ui.dialog.replace(() => createComponent(TreeBranchSummaryDialog, {
      ui: input.ui,
      theme: input.theme(),
      onClose: closeSummaryDialog,
      onCancelBusy: cancelActiveSummary,
      onSelect: (request) => handleBranchSummaryRequest(nextDialogAction, request)
    }), () => {
      cancelActiveSummary();
      setSummaryDialogAction((currentDialogAction) => currentDialogAction === nextDialogAction ? undefined : currentDialogAction);
    });
  }));
  return {
    busyState,
    busy,
    actionErrorMessage,
    cancelActiveSummary,
    openBranchSummaryDialog,
    runTreeBranchAction
  };
}

// src/lib/tree/route.tsx
function TreeRoute(props) {
  const [selectedIndex, setSelectedIndex] = createSignal3();
  const [treeFocused, setTreeFocused] = createSignal3(false);
  const dimensions = useTerminalDimensions();
  const theme = createMemo4(() => props.theme());
  const palette = createMemo4(() => mapTreeTheme(theme()));
  const bootstrapInput = createMemo4(() => {
    if (!props.projectRoot || !props.storageRoot)
      return;
    return {
      projectRoot: props.projectRoot,
      storageRoot: props.storageRoot,
      sessionID: props.sessionID
    };
  });
  const [bootstrap] = createResource(bootstrapInput, (input) => bootstrapTree(input));
  const bootstrapErrorMessage = createMemo4(() => {
    const error = bootstrap.error;
    if (!error)
      return;
    return error instanceof Error ? error.message : String(error);
  });
  const projectedInput = createMemo4(() => {
    const result = bootstrap();
    if (!result || result.kind === "missing-session-context")
      return;
    return result;
  });
  const [projectedTreeData] = createResource(projectedInput, async (result) => {
    const transcripts = await props.loadSessionTranscripts(result.snapshot);
    const projectedTree = projectSessionTree(result.snapshot, transcripts);
    const flatTree = buildFlatRows(projectedTree, result.currentSessionId);
    return {
      transcripts,
      flatTree
    };
  });
  const projectedErrorMessage = createMemo4(() => {
    const error = projectedTreeData.error;
    if (!error)
      return;
    return error instanceof Error ? error.message : String(error);
  });
  const rows = createMemo4(() => projectedTreeData()?.flatTree.rows ?? []);
  const selectedRow = createMemo4(() => {
    const index = selectedIndex();
    if (index === undefined)
      return;
    return rows()[index];
  });
  const treeWidth = createMemo4(() => getTreeContentWidth(dimensions().width));
  const bodyState = createMemo4(() => resolveTreeRouteBodyState({
    projectRoot: props.projectRoot,
    bootstrapLoading: bootstrap.loading,
    bootstrapErrorMessage: bootstrapErrorMessage(),
    missingSessionContext: bootstrap()?.kind === "missing-session-context",
    projectedLoading: Boolean(projectedInput()) && projectedTreeData.loading,
    projectedErrorMessage: projectedErrorMessage(),
    rows: rows()
  }));
  const branchController = createTreeRouteBranchController({
    client: props.client,
    ui: props.ui,
    theme,
    navigateToSession: props.navigateToSession,
    bootstrap,
    projectedTreeData,
    selectedRow
  });
  createEffect4(on3(projectedTreeData, (nextTreeData) => {
    const currentSessionId = props.sessionID;
    if (!currentSessionId) {
      setSelectedIndex(undefined);
      return;
    }
    if (!nextTreeData) {
      setSelectedIndex(undefined);
      return;
    }
    setSelectedIndex(getInitialSelectedRowIndex(nextTreeData.flatTree, currentSessionId));
  }));
  useKeyboard2((evt) => {
    if (evt.defaultPrevented)
      return;
    const currentBusyState = branchController.busyState();
    if (currentBusyState?.kind === "summarizing" && (evt.name === "escape" || evt.ctrl && evt.name === "c")) {
      evt.preventDefault();
      evt.stopPropagation();
      currentBusyState.controller.abort();
      return;
    }
    if (!treeFocused())
      return;
    if (props.ui.dialog.open)
      return;
    if (branchController.busy())
      return;
    if (evt.name === "escape" || evt.ctrl && evt.name === "c") {
      if (!props.sessionID)
        return;
      evt.preventDefault();
      evt.stopPropagation();
      props.navigateToSession(props.sessionID);
      return;
    }
    if (rows().length === 0)
      return;
    if (evt.name === "up" || evt.name === "k") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((currentIndex) => moveSelectionUp(rows(), currentIndex));
      return;
    }
    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((currentIndex) => moveSelectionDown(rows(), currentIndex));
      return;
    }
    if (evt.name === "return") {
      const treeData = projectedTreeData();
      if (!treeData)
        return;
      evt.preventDefault();
      evt.stopPropagation();
      const action = planTreeBranchAction({
        row: selectedRow(),
        transcripts: treeData.transcripts
      });
      if (isTreeBranchForkAction(action)) {
        branchController.openBranchSummaryDialog(action);
        return;
      }
      branchController.runTreeBranchAction(action);
    }
  });
  return (() => {
    var _el$ = _$createElement5("box");
    _$setProp5(_el$, "flexDirection", "column");
    _$setProp5(_el$, "width", "100%");
    _$setProp5(_el$, "height", "100%");
    _$setProp5(_el$, "paddingLeft", 1);
    _$setProp5(_el$, "paddingRight", 1);
    _$setProp5(_el$, "paddingTop", 0);
    _$setProp5(_el$, "paddingBottom", 1);
    _$setProp5(_el$, "gap", 0);
    _$insert5(_el$, _$createComponent5(TreeRouteHelpPanel, {
      get palette() {
        return palette();
      },
      get busy() {
        return branchController.busy();
      }
    }), null);
    _$insert5(_el$, _$createComponent5(Show4, {
      get when() {
        return branchController.actionErrorMessage();
      },
      keyed: true,
      children: (message) => _$createComponent5(TreeRouteStatusPanel, {
        get palette() {
          return palette();
        },
        tone: "error",
        message: `Action error: ${message}`
      })
    }), null);
    _$insert5(_el$, _$createComponent5(TreeRouteBody, {
      get state() {
        return bodyState();
      },
      get palette() {
        return palette();
      },
      theme,
      get selectedIndex() {
        return selectedIndex();
      },
      get treeWidth() {
        return treeWidth();
      },
      onFocusChange: setTreeFocused
    }), null);
    _$effect5((_$p) => _$setProp5(_el$, "backgroundColor", palette().screenBackground, _$p));
    return _el$;
  })();
}

// src/lib/tree/route-params.ts
function isSessionRoute(current) {
  return current.name === "session";
}
function getTreeRouteParamsForNavigation(current) {
  if (!isSessionRoute(current))
    return;
  return { sessionID: current.params.sessionID };
}
function parseTreeRouteParams(params) {
  const sessionID = typeof params?.sessionID === "string" ? params.sessionID : undefined;
  return sessionID ? { sessionID } : {};
}

// src/tui.ts
var id = "opencode.tree";
var routeName = "tree";
var tui = async (api, options) => {
  const pluginOptions = parseTreePluginOptions(options);
  api.command.register(() => {
    const current = api.route.current;
    const inSession = isSessionRoute(current);
    return [
      {
        title: "Tree",
        value: "tree.open",
        category: "Plugin",
        hidden: !inSession,
        enabled: inSession,
        slash: {
          name: "tree"
        },
        onSelect: () => {
          api.route.navigate(routeName, getTreeRouteParamsForNavigation(api.route.current));
        }
      }
    ];
  });
  api.route.register([
    {
      name: routeName,
      render: ({ params }) => {
        const projectRoot = resolveProjectRoot(api.state.path);
        const storageRoot = projectRoot ? resolveStorageRoot({
          projectRoot,
          stateRoot: api.state.path.state,
          storageScope: pluginOptions.storageScope
        }) : undefined;
        return createComponent2(TreeRoute, {
          client: api.client,
          ui: {
            dialog: api.ui.dialog,
            DialogPrompt: api.ui.DialogPrompt,
            DialogSelect: api.ui.DialogSelect
          },
          projectRoot,
          storageRoot,
          theme: () => api.theme.current,
          loadSessionTranscripts: createSnapshotSessionTranscriptsLoader(api.client, {
            directory: projectRoot
          }),
          navigateToSession: (sessionId) => {
            api.route.navigate("session", { sessionID: sessionId });
          },
          ...parseTreeRouteParams(params)
        });
      }
    }
  ]);
};
var tui_default = {
  id,
  tui
};
export {
  tui_default as default
};
