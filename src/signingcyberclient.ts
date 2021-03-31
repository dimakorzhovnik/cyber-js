import {
  CosmosFeeTable,
  makeSignDoc as makeSignDocAmino,
  buildFeeTable,
  GasLimits,
  GasPrice,
  StdFee,
  Coin,
} from "@cosmjs/launchpad";
import Long from "long";
import {
  encodeSecp256k1Pubkey
} from "@cosmjs/amino";
import {
  EncodeObject,
  encodePubkey,
  isOfflineDirectSigner,
  makeAuthInfoBytes,
  makeSignDoc,
  OfflineSigner,
  Registry,
} from "@cosmjs/proto-signing";
import {
  AminoTypes,
  BroadcastTxFailure,
  BroadcastTxResponse,
  defaultRegistryTypes,
  isBroadcastTxFailure,
  logs,
} from "@cosmjs/stargate";
import {
  fromBase64,
  toHex,
  toUtf8
} from "@cosmjs/encoding";
import {
  Int53,
  Uint53,
  Uint64,
} from "@cosmjs/math";
import {
  Tendermint34Client
} from "@cosmjs/tendermint-rpc";
import {
  SignMode
} from "@cosmjs/stargate/build/codec/cosmos/tx/signing/v1beta1/signing";
import {
  TxRaw
} from "@cosmjs/stargate/build/codec/cosmos/tx/v1beta1/tx";
import {
  MsgCyberlink,
} from "./codec/graph/v1beta1/graph"
import {
  MsgConvert,
} from "./codec/resources/v1beta1/tx"
import {
  MsgCreateEnergyRoute,
  MsgDeleteEnergyRoute,
  MsgEditEnergyRoute,
  MsgEditEnergyRouteAlias,
} from "./codec/energy/v1beta1/tx"
import {
  CyberClient
} from "./cyberclient";

interface CyberFeeTable extends CosmosFeeTable {
  readonly cyberlink: StdFee;
  readonly convert: StdFee;
  readonly createRoute: StdFee;
  readonly editRoute: StdFee;
  readonly deleteRoute: StdFee;
  readonly editRouteAlias: StdFee;
}

const defaultGasPrice = GasPrice.fromString("0.001nick");
const defaultGasLimits: GasLimits < CyberFeeTable > = {
  cyberlink: 256000,
  convert: 128000,
  send: 128000,
  createRoute: 100000,
  editRoute: 100000,
  deleteRoute: 100000,
  editRouteAlias: 100000,
};

export interface SendResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface CyberlinkResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface ConvertResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface CreateRouteResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface EditRouteResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface DeleteRouteResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

export interface EditRouteAliasResult {
  readonly logs: readonly logs.Log[];
  readonly transactionHash: string;
}

function createBroadcastTxErrorMessage(result: BroadcastTxFailure): string {
  return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

function createDefaultRegistry(): Registry {
  return new Registry([
    ...defaultRegistryTypes,
    ["/cyber.graph.v1beta1.MsgCyberlink", MsgCyberlink, ],
    ["/cyber.resources.v1beta1.MsgConvert", MsgConvert, ],
    ["/cyber.energy.v1beta1.MsgCreateEnergyRoute", MsgCreateEnergyRoute, ],
    ["/cyber.energy.v1beta1.MsgEditEnergyRoute", MsgEditEnergyRoute, ],
    ["/cyber.energy.v1beta1.MsgDeleteEnergyRoute", MsgDeleteEnergyRoute, ],
    ["/cyber.energy.v1beta1.MsgEditEnergyRouteAlias", MsgEditEnergyRouteAlias, ],
  ]);
}

export interface SigningCyberClientOptions {
  readonly registry ? : Registry;
  readonly aminoTypes ? : AminoTypes;
  readonly prefix ? : string;
  readonly gasPrice ? : GasPrice;
  readonly gasLimits ? : GasLimits < CosmosFeeTable > ;
}

export class SigningCyberClient extends CyberClient {
  public readonly fees: CosmosFeeTable;
  public readonly registry: Registry;

  private readonly signer: OfflineSigner;
  private readonly aminoTypes: AminoTypes;

  public static async connectWithSigner(
    endpoint: string,
    signer: OfflineSigner,
    options: SigningCyberClientOptions = {},
  ): Promise < SigningCyberClient > {
    const tmClient = await Tendermint34Client.connect(endpoint);
    return new SigningCyberClient(tmClient, signer, options);
  }

  private constructor(
    tmClient: Tendermint34Client,
    signer: OfflineSigner,
    options: SigningCyberClientOptions,
  ) {
    super(tmClient);
    const {
      registry = createDefaultRegistry(),
        aminoTypes = new AminoTypes({
          additions: {},
          prefix: options.prefix
        }),
        gasPrice = defaultGasPrice,
        gasLimits = defaultGasLimits,
    } = options;
    this.fees = buildFeeTable < CosmosFeeTable > (gasPrice, defaultGasLimits, gasLimits);
    this.registry = registry;
    this.aminoTypes = aminoTypes;
    this.signer = signer;
  }

  // ------------------

  public async sendTokens(
    senderAddress: string,
    recipientAddress: string,
    transferAmount: readonly Coin[],
    memo = "",
  ): Promise < SendResult > {
    const sendMsg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        amount: transferAmount,
      },
    };
    const result = await this.signAndBroadcast(senderAddress, [sendMsg], this.fees.send, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  // ------------------

  public async cyberlink(
    senderAddress: string,
    from: string,
    to: string,
    memo = "",
  ): Promise < CyberlinkResult > {
    const cyberlinkMsg = {
      typeUrl: "/cyber.graph.v1beta1.MsgCyberlink",
      value: {
        address: senderAddress,
        links: [{
          from: from,
          to: to,
        }]
      },
    };
    const result = await this.signAndBroadcast(senderAddress, [cyberlinkMsg], this.fees.cyberlink, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  // ------------------

  public async convertResources(
    senderAddress: string,
    amount: Coin,
    resource: string,
    time: number,
    memo = "",
  ): Promise < ConvertResult > {
    const convertResourcesMsg = {
      typeUrl: "/cyber.resources.v1beta1.MsgConvert",
      value: MsgConvert.fromPartial({
        agent: senderAddress,
        amount: amount,
        resource: resource,
        endTime: Long.fromString(new Uint53(10000).toString()),
      }),
    };
    const result = await this.signAndBroadcast(senderAddress, [convertResourcesMsg], this.fees.convert, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  // ------------------

  public async createEnergyRoute(
    senderAddress: string,
    destination: string,
    alias: string,
    memo = "",
  ): Promise < CreateRouteResult > {
    const createEnergyRouteMsg = {
      typeUrl: "/cyber.energy.v1beta1.MsgCreateEnergyRoute",
      value: MsgCreateEnergyRoute.fromPartial({
        source: senderAddress,
        destination: destination,
        alias: alias,
      }),
    };
    const result = await this.signAndBroadcast(senderAddress, [createEnergyRouteMsg], this.fees.createRoute, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  public async editEnergyRoute(
    senderAddress: string,
    destination: string,
    value: Coin,
    memo = "",
  ): Promise < EditRouteResult > {
    const editEnergyRouteMsg = {
      typeUrl: "/cyber.energy.v1beta1.MsgEditEnergyRoute",
      value: MsgEditEnergyRoute.fromPartial({
        source: senderAddress,
        destination: destination,
        value: value,
      }),
    };
    const result = await this.signAndBroadcast(senderAddress, [editEnergyRouteMsg], this.fees.editRoute, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  public async deleteEnergyRoute(
    senderAddress: string,
    destination: string,
    memo = "",
  ): Promise < DeleteRouteResult > {
    const deleteEnergyRouteMsg = {
      typeUrl: "/cyber.energy.v1beta1.MsgDeleteEnergyRoute",
      value: MsgDeleteEnergyRoute.fromPartial({
        source: senderAddress,
        destination: destination,
      }),
    };
    const result = await this.signAndBroadcast(senderAddress, [deleteEnergyRouteMsg], this.fees.deleteRoute, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  public async editEnergyRouteAlias(
    senderAddress: string,
    destination: string,
    alias: string,
    memo = "",
  ): Promise < EditRouteAliasResult > {
    const editEnergyRouteAliasMsg = {
      typeUrl: "/cyber.energy.v1beta1.MsgEditEnergyRouteAlias",
      value: MsgEditEnergyRouteAlias.fromPartial({
        source: senderAddress,
        destination: destination,
        alias: alias,
      }),
    };
    const result = await this.signAndBroadcast(senderAddress, [editEnergyRouteAliasMsg], this.fees.editRouteAlias, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      transactionHash: result.transactionHash,
    };
  }

  // ------------------

  public async signAndBroadcast(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo = "",
  ): Promise < BroadcastTxResponse > {
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    );
    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }
    const pubkey = encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey));
    const accountFromChain = await this.getAccount(signerAddress);
    if (!accountFromChain) {
      throw new Error("Account not found");
    }
    const {
      accountNumber,
      sequence
    } = accountFromChain;
    const chainId = await this.getChainId();
    const txBody = {
      messages: messages,
      memo: memo,
    };
    const txBodyBytes = this.registry.encode({
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: txBody,
    });
    const gasLimit = Int53.fromString(fee.gas).toNumber();

    if (isOfflineDirectSigner(this.signer)) {
      const authInfoBytes = makeAuthInfoBytes([pubkey], fee.amount, gasLimit, sequence);
      const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
      const {
        signature,
        signed
      } = await this.signer.signDirect(signerAddress, signDoc);
      const txRaw = TxRaw.fromPartial({
        bodyBytes: signed.bodyBytes,
        authInfoBytes: signed.authInfoBytes,
        signatures: [fromBase64(signature.signature)],
      });
      const signedTx = Uint8Array.from(TxRaw.encode(txRaw).finish());
      return this.broadcastTx(signedTx);
    }

    // Amino signer
    const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
    const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg));
    const signDoc = makeSignDocAmino(msgs, fee, chainId, memo, accountNumber, sequence);
    const {
      signature,
      signed
    } = await this.signer.signAmino(signerAddress, signDoc);
    const signedTxBody = {
      messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
      memo: signed.memo,
    };
    const signedTxBodyBytes = this.registry.encode({
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: signedTxBody,
    });
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
    const signedSequence = Int53.fromString(signed.sequence).toNumber();
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [pubkey],
      signed.fee.amount,
      signedGasLimit,
      signedSequence,
      signMode,
    );
    const txRaw = TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
    const signedTx = Uint8Array.from(TxRaw.encode(txRaw).finish());
    return this.broadcastTx(signedTx);
  }
}