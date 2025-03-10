import { watch } from '@vue/composition-api';
import { mnemonicToSeed } from '@aeternity/bip39';
import { defer } from 'lodash-es';
import { isFQDN } from 'validator';
import { derivePathFromKey, getKeyPair } from '@aeternity/hd-wallet/src/hd-key';
import {
  SCHEMA,
  Crypto,
  AmountFormatter,
  TxBuilder,
  TxBuilderHelper,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import {
  CONNECTION_TYPES,
  STUB_ADDRESS,
  STUB_CALLDATA,
  STUB_NONCE,
  MAX_UINT256,
  MAGNITUDE,
  SEED_LENGTH,
  AENS_NAME_MAX_LENGTH,
} from './constants';
import { testAccount, txParams } from './config';
import runMigrations from '../../store/migrations';
import { IS_FIREFOX } from '../../lib/environment';

export function watchUntilTruthy(getter) {
  return new Promise((resolve) => {
    const unwatch = watch(
      getter,
      (value) => {
        if (!value) return;
        resolve();
        defer(() => unwatch());
      },
      { immediate: true },
    );
  });
}

export function waitUntilTruthy(getter) {
  const poll = (resolve) => {
    if (getter()) resolve();
    else setTimeout(() => poll(resolve), 400);
  };

  return new Promise(poll);
}

// eslint-disable-next-line no-console
export const handleUnknownError = (error) => console.warn('Unknown rejection', error);

export const aeToAettos = (v) => AmountFormatter.formatAmount(v.toString(), {
  denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
  targetDenomination: AmountFormatter.AE_AMOUNT_FORMATS.AETTOS,
});
export const aettosToAe = (v) => AmountFormatter.formatAmount(v.toString(), {
  denomination: AmountFormatter.AE_AMOUNT_FORMATS.AETTOS,
  targetDenomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
});

export const calculateSupplyAmount = (_balance, _totalSupply, _reserve) => {
  if (!_balance || !_totalSupply || !_reserve) {
    return null;
  }
  const share = BigNumber(_balance).times(100).div(_totalSupply);
  const amount = BigNumber(_reserve).times(share).div(100);
  return amount.toFixed(0);
};

export const calculateFee = (type, params) => {
  const MIN_FEE = TxBuilder.calculateMinFee(type, {
    params: {
      ...type === 'spendTx' ? {
        senderId: STUB_ADDRESS,
        recipientId: STUB_ADDRESS,
      } : {},
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
      ctVersion: { abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA, vmVersion: SCHEMA.VM_VERSIONS.SOPHIA },
      abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA,
      callData: STUB_CALLDATA,
      gas: 0,
      ...params,
    },
    ...type === 'nameClaimTx' ? { vsn: SCHEMA.VSN_2 } : {},
  });
  return BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE);
};

export const calculateNameClaimFee = (name) => calculateFee(SCHEMA.TX_TYPE.nameClaim, {
  accountId: STUB_ADDRESS,
  name,
  nameSalt: Crypto.salt(),
  nameFee: TxBuilderHelper.getMinimumNameFee(name),
  nonce: STUB_NONCE,
  ttl: SCHEMA.NAME_TTL,
});

export const toURL = (url) => new URL(url.includes('://') ? url : `https://${url}`);

export const validateTipUrl = (urlAsString) => {
  try {
    const url = toURL(urlAsString);
    return ['http:', 'https:'].includes(url.protocol) && isFQDN(url.hostname);
  } catch (e) {
    return false;
  }
};

export const detectConnectionType = (port) => {
  const extensionProtocol = IS_FIREFOX ? 'moz-extension' : 'chrome-extension';
  const [senderUrl] = port.sender.url.split('?');
  const isExtensionSender = senderUrl.startsWith(`${extensionProtocol}://${browser.runtime.id}/index.html`)
    || IS_FIREFOX;
  if (CONNECTION_TYPES.POPUP === port.name && isExtensionSender) {
    return port.name;
  }
  return CONNECTION_TYPES.OTHER;
};

export const fetchJson = async (...args) => {
  const response = await fetch(...args);
  return response.json();
};

export const postJson = (url, options) => fetchJson(url, {
  method: 'post',
  headers: { 'Content-Type': 'application/json' },
  ...options,
  body: options.body && JSON.stringify(options.body),
});

export const checkAddress = (value) => Crypto.isAddressValid(value, 'ak')
  || Crypto.isAddressValid(value, 'ct')
  || Crypto.isAddressValid(value, 'ok');

export const checkAddressOrChannel = (value) => checkAddress(value) || Crypto.isAddressValid(value, 'ch');

export const checkAensName = (value) => (
  value.length <= AENS_NAME_MAX_LENGTH
  && /^[\p{L}\d]+\.chain$/gu.test(value)
);

export const getAddressByNameEntry = (nameEntry, pointer = 'account_pubkey') => ((nameEntry.pointers && nameEntry.pointers.find(({ key }) => key === pointer)) || {}).id;

export const validateSeedLength = (seed) => seed && seed.split(' ').length === SEED_LENGTH;

export const contractCall = async ({
  instance,
  method,
  params = [],
  decode = false,
  async = true,
}) => {
  let call;
  try {
    call = await instance.methods[method](...params);
  } catch (e) {
    if (e.message.indexOf('wrong_abi_version') > -1) {
      instance.setOptions({ backend: 'aevm' });
      return contractCall({
        instance, method, params, decode, async,
      });
    }
    throw e.message;
  }

  if (async) return decode ? call.decodedResult : call;
  return instance.methods[method](...params);
};

export const setContractInstance = async (tx, sdk, contractAddress = null) => {
  let contractInstance = false;
  try {
    let backend = 'fate';
    if (typeof tx.abi_version !== 'undefined' && tx.abi_version !== 3) {
      backend = 'aevm';
    }
    contractInstance = await sdk.getContractInstance({
      source: tx.source,
      contractAddress,
    });
    contractInstance.setOptions({ backend });
  } catch (e) {
    handleUnknownError(e);
  }
  return Promise.resolve(contractInstance);
};

export const getTwitterAccountUrl = (url) => {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
};

export const isNotFoundError = (error) => error.statusCode === 404;

export const isAccountNotFoundError = (error) => isNotFoundError(error) && error?.response?.body?.reason === 'Account not found';

export const setBalanceLocalStorage = (balance) => {
  localStorage.rxjs = JSON.stringify({ ...JSON.parse(localStorage.rxjs || '{}'), balance });
};

export const getBalanceLocalStorage = () => (
  localStorage.rxjs ? JSON.parse(localStorage.rxjs).balance : {}
);

export const categorizeContractCallTxObject = (transaction) => {
  if (transaction.incomplete
    || ((transaction.tx.function === 'tip' || transaction.tx.function === 'retip') && transaction.pending)) {
    if (!transaction.tx?.selectedTokenContractId && transaction.pending) return null;
    return {
      amount: transaction.amount,
      token: transaction.pending
        ? transaction.tx?.selectedTokenContractId : transaction.tx.contractId,
      to: transaction.tx.callerId,
    };
  }
  if (transaction.tx.type !== 'ContractCallTx') return null;
  switch (transaction.tx.function) {
    case 'transfer':
    case 'transfer_payload':
    case 'change_allowance':
    case 'create_allowance':
      return {
        to: transaction.tx.arguments[0].value,
        amount: transaction.tx.arguments[1].value,
        token: transaction.tx.contractId,
      };
    case 'tip_token':
      return {
        url: transaction.tx.arguments[0].value,
        note: transaction.tx.arguments[1].value,
        amount: transaction.tx.arguments[3].value,
        token: transaction.tx.arguments[2].value,
      };
    case 'retip_token':
      return {
        url: transaction.tx.arguments[0].value,
        amount: transaction.tx.arguments[2].value,
        token: transaction.tx.arguments[1].value,
      };
    default:
      return null;
  }
};

export const readValueFromClipboard = async () => {
  if (!process.env.UNFINISHED_FEATURES) return undefined;
  let value = '';
  switch (process.env.PLATFORM) {
    case 'cordova':
      value = await new Promise((...args) => window
        .cordova.plugins.clipboard.paste(...args));
      break;
    case 'extension':
      value = await browser.runtime.sendMessage({ method: 'paste' });
      break;
    default:
      try {
        value = await navigator.clipboard.readText();
      } catch (e) {
        if (!e.message.includes('Read permission denied.')) {
          handleUnknownError(e);
        }
      }
  }
  return value;
};

export const getAllPages = async (getFunction, getNextPage) => {
  const result = [];
  let nextPageUrl;
  while (nextPageUrl !== null) {
    // eslint-disable-next-line no-await-in-loop
    const { data, next } = await (nextPageUrl
      ? getNextPage(nextPageUrl)
      : getFunction());
    if (data?.length) result.push(...data);
    nextPageUrl = next || null;
  }
  return result;
};

export const amountRounded = (rawAmount) => {
  let amount = rawAmount;
  if (typeof rawAmount !== 'object') {
    amount = new BigNumber(rawAmount);
  }

  if (amount < 0.01 && amount.toString().length < 9 + 2) {
    return amount.toFixed();
  }
  return amount.toFixed((amount < 0.01) ? 9 : 2);
};

export const truncateAddress = (address) => {
  const addressLength = address.length;
  const firstPart = address.slice(0, 6).match(/.{3}/g);
  const secondPart = address.slice(addressLength - 3, addressLength).match(/.{3}/g);
  return [
    firstPart.slice(0, 2).reduce((acc, current) => `${acc}${current}`),
    secondPart.slice(-1).reduce((acc, current) => `${acc}${current}`),
  ];
};

export const getHdWalletAccount = (wallet, accountIdx = 0) => {
  const keyPair = getKeyPair(derivePathFromKey(`${accountIdx}h/0h/0h`, wallet).privateKey);
  return {
    ...keyPair,
    idx: accountIdx,
    address: TxBuilderHelper.encode(keyPair.publicKey, 'ak'),
  };
};

export const getLoginState = async ({
  backedUpSeed,
  balance,
  name,
  pendingTransaction,
  network,
}) => {
  const { mnemonic, address } = testAccount;
  const account = {
    address,
    privateKey: mnemonicToSeed(mnemonic).toString('hex'),
  };
  return {
    ...(await runMigrations()),
    account,
    mnemonic,
    backedUpSeed,
    current: { network: network || 'Testnet', token: 0, currency: 'usd' },
    balance,
    ...(name && { names: { defaults: { [`${account.address}-ae_uat`]: name } } }),
    ...(pendingTransaction
        && { transactions: { loaded: [], pending: { ae_uat: [pendingTransaction] } } }),
  };
};

export const buildTx = (txtype) => TxBuilder.buildTx({ ...txParams[txtype] }, txtype);
