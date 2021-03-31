/* eslint-disable */
import { Coin } from "../../cosmos_proto/coin";
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "cyber.energy.v1beta1";

export interface Route {
  source: string;
  destination: string;
  alias: string;
  value: Coin[];
}

/** workaround */
export interface Value {
  value: Coin[];
}

const baseRoute: object = { source: "", destination: "", alias: "" };

export const Route = {
  encode(message: Route, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.source !== "") {
      writer.uint32(10).string(message.source);
    }
    if (message.destination !== "") {
      writer.uint32(18).string(message.destination);
    }
    if (message.alias !== "") {
      writer.uint32(26).string(message.alias);
    }
    for (const v of message.value) {
      Coin.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Route {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseRoute } as Route;
    message.value = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.source = reader.string();
          break;
        case 2:
          message.destination = reader.string();
          break;
        case 3:
          message.alias = reader.string();
          break;
        case 4:
          message.value.push(Coin.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Route {
    const message = { ...baseRoute } as Route;
    message.value = [];
    if (object.source !== undefined && object.source !== null) {
      message.source = String(object.source);
    } else {
      message.source = "";
    }
    if (object.destination !== undefined && object.destination !== null) {
      message.destination = String(object.destination);
    } else {
      message.destination = "";
    }
    if (object.alias !== undefined && object.alias !== null) {
      message.alias = String(object.alias);
    } else {
      message.alias = "";
    }
    if (object.value !== undefined && object.value !== null) {
      for (const e of object.value) {
        message.value.push(Coin.fromJSON(e));
      }
    }
    return message;
  },

  toJSON(message: Route): unknown {
    const obj: any = {};
    message.source !== undefined && (obj.source = message.source);
    message.destination !== undefined &&
      (obj.destination = message.destination);
    message.alias !== undefined && (obj.alias = message.alias);
    if (message.value) {
      obj.value = message.value.map((e) => (e ? Coin.toJSON(e) : undefined));
    } else {
      obj.value = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Route>): Route {
    const message = { ...baseRoute } as Route;
    message.value = [];
    if (object.source !== undefined && object.source !== null) {
      message.source = object.source;
    } else {
      message.source = "";
    }
    if (object.destination !== undefined && object.destination !== null) {
      message.destination = object.destination;
    } else {
      message.destination = "";
    }
    if (object.alias !== undefined && object.alias !== null) {
      message.alias = object.alias;
    } else {
      message.alias = "";
    }
    if (object.value !== undefined && object.value !== null) {
      for (const e of object.value) {
        message.value.push(Coin.fromPartial(e));
      }
    }
    return message;
  },
};

const baseValue: object = {};

export const Value = {
  encode(message: Value, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.value) {
      Coin.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Value {
    const reader = input instanceof Uint8Array ? new _m0.Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = { ...baseValue } as Value;
    message.value = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.value.push(Coin.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Value {
    const message = { ...baseValue } as Value;
    message.value = [];
    if (object.value !== undefined && object.value !== null) {
      for (const e of object.value) {
        message.value.push(Coin.fromJSON(e));
      }
    }
    return message;
  },

  toJSON(message: Value): unknown {
    const obj: any = {};
    if (message.value) {
      obj.value = message.value.map((e) => (e ? Coin.toJSON(e) : undefined));
    } else {
      obj.value = [];
    }
    return obj;
  },

  fromPartial(object: DeepPartial<Value>): Value {
    const message = { ...baseValue } as Value;
    message.value = [];
    if (object.value !== undefined && object.value !== null) {
      for (const e of object.value) {
        message.value.push(Coin.fromPartial(e));
      }
    }
    return message;
  },
};

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | undefined
  | Long;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;
