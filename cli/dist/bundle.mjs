#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../lib/constants.ts
var YAPPR_CONTRACT_ID, YAPPR_PROFILE_CONTRACT_ID, YAPPR_DM_CONTRACT_ID, YAPPR_BLOCK_CONTRACT_ID, DPNS_CONTRACT_ID, DEFAULT_NETWORK, DOCUMENT_TYPES, DPNS_DOCUMENT_TYPE;
var init_constants = __esm({
  "../lib/constants.ts"() {
    "use strict";
    YAPPR_CONTRACT_ID = "AyWK6nDVfb8d1ZmkM5MmZZrThbUyWyso1aMeGuuVSfxf";
    YAPPR_PROFILE_CONTRACT_ID = "FZSnZdKsLAuWxE7iZJq12eEz6xfGTgKPxK7uZJapTQxe";
    YAPPR_DM_CONTRACT_ID = "J7MP9YU1aEGNAe7bjB45XdrjDLBsevFLPK1t1YwFS4ck";
    YAPPR_BLOCK_CONTRACT_ID = "DCLfH2tgyQhyaFeQigFk8ptC1MjQgsDghkYDvDrLMF3m";
    DPNS_CONTRACT_ID = "GWRSAVFMjXx8HpQFaNJMqBV7MBgMK4br5UESsB4S31Ec";
    DEFAULT_NETWORK = "testnet";
    DOCUMENT_TYPES = {
      PROFILE: "profile",
      AVATAR: "avatar",
      POST: "post",
      LIKE: "like",
      REPOST: "repost",
      FOLLOW: "follow",
      BOOKMARK: "bookmark",
      LIST: "list",
      LIST_MEMBER: "listMember",
      BLOCK: "block",
      BLOCK_FILTER: "blockFilter",
      BLOCK_FOLLOW: "blockFollow",
      MUTE: "mute",
      DIRECT_MESSAGE: "directMessage",
      NOTIFICATION: "notification",
      ENCRYPTED_KEY_BACKUP: "encryptedKeyBackup",
      POST_HASHTAG: "postHashtag"
    };
    DPNS_DOCUMENT_TYPE = "domain";
  }
});

// ../lib/services/evo-sdk-service.ts
var evo_sdk_service_exports = {};
__export(evo_sdk_service_exports, {
  evoSdkService: () => evoSdkService,
  getEvoSdk: () => getEvoSdk
});
import { EvoSDK } from "@dashevo/evo-sdk";
async function getEvoSdk() {
  return evoSdkService.getSdk();
}
var EvoSdkService, evoSdkService;
var init_evo_sdk_service = __esm({
  "../lib/services/evo-sdk-service.ts"() {
    "use strict";
    init_constants();
    EvoSdkService = class {
      constructor() {
        this.sdk = null;
        this.initPromise = null;
        this.config = null;
        this._isInitialized = false;
        this._isInitializing = false;
      }
      /**
       * Initialize the SDK with configuration
       */
      async initialize(config) {
        if (this._isInitialized && this.config && this.config.network === config.network && this.config.contractId === config.contractId) {
          return;
        }
        if (this._isInitializing && this.initPromise) {
          await this.initPromise;
          return;
        }
        if (this._isInitialized && this.config && (this.config.network !== config.network || this.config.contractId !== config.contractId)) {
          await this.cleanup();
        }
        this.config = config;
        this._isInitializing = true;
        this.initPromise = this._performInitialization();
        try {
          await this.initPromise;
        } finally {
          this._isInitializing = false;
        }
      }
      async _performInitialization() {
        try {
          console.log("EvoSdkService: Creating EvoSDK instance...");
          if (this.config.network === "testnet") {
            console.log("EvoSdkService: Building testnet SDK in trusted mode...");
            this.sdk = EvoSDK.testnetTrusted({
              settings: {
                timeoutMs: 8e3
              }
            });
          } else {
            console.log("EvoSdkService: Building mainnet SDK in trusted mode...");
            this.sdk = EvoSDK.mainnetTrusted({
              settings: {
                timeoutMs: 8e3
              }
            });
          }
          console.log("EvoSdkService: Connecting to network...");
          await this.sdk.connect();
          console.log("EvoSdkService: Connected successfully");
          this._isInitialized = true;
          console.log("EvoSdkService: SDK initialized successfully");
          await this._preloadContracts();
        } catch (error) {
          console.error("EvoSdkService: Failed to initialize SDK:", error);
          console.error("EvoSdkService: Error details:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : void 0
          });
          this.initPromise = null;
          this._isInitialized = false;
          throw error;
        }
      }
      /**
       * Preload contracts to cache them and avoid repeated fetches
       */
      async _preloadContracts() {
        if (!this.config || !this.sdk) {
          return;
        }
        try {
          console.log("EvoSdkService: Preloading contracts...");
          const yapprContractId = this.config.contractId;
          try {
            await this.sdk.contracts.fetch(yapprContractId);
            console.log("EvoSdkService: Yappr contract cached");
          } catch (error) {
            console.log("EvoSdkService: Yappr contract not found (expected for local development)");
          }
          try {
            await this.sdk.contracts.fetch(DPNS_CONTRACT_ID);
            console.log("EvoSdkService: DPNS contract cached");
          } catch (error) {
            console.log("EvoSdkService: DPNS contract fetch failed:", error);
          }
          if (YAPPR_DM_CONTRACT_ID && !YAPPR_DM_CONTRACT_ID.includes("PLACEHOLDER")) {
            try {
              await this.sdk.contracts.fetch(YAPPR_DM_CONTRACT_ID);
              console.log("EvoSdkService: DM contract cached");
            } catch (error) {
              console.log("EvoSdkService: DM contract fetch failed:", error);
            }
          }
        } catch (error) {
          console.error("EvoSdkService: Error during contract preload:", error);
        }
      }
      /**
       * Get the SDK instance, initializing if necessary
       */
      async getSdk() {
        if (!this._isInitialized || !this.sdk) {
          if (!this.config) {
            throw new Error("SDK not configured. Call initialize() first.");
          }
          await this.initialize(this.config);
        }
        return this.sdk;
      }
      /**
       * Check if SDK is initialized
       */
      isReady() {
        return this._isInitialized && this.sdk !== null;
      }
      /**
       * Check if SDK is initialized
       */
      isInitialized() {
        return this._isInitialized && this.sdk !== null;
      }
      /**
       * Clean up resources
       */
      async cleanup() {
        this.sdk = null;
        this._isInitialized = false;
        this._isInitializing = false;
        this.initPromise = null;
        this.config = null;
      }
      /**
       * Check if error is a "no available addresses" error that requires reconnection
       */
      isNoAvailableAddressesError(error) {
        const message2 = error?.message || String(error);
        return message2.toLowerCase().includes("no available addresses") || message2.toLowerCase().includes("noavailableaddressesforretry");
      }
      /**
       * Handle connection errors by reinitializing the SDK
       * Returns true if recovery was attempted
       */
      async handleConnectionError(error) {
        if (this.isNoAvailableAddressesError(error)) {
          console.log('EvoSdkService: Detected "no available addresses" error, attempting to reconnect...');
          try {
            const savedConfig = this.config;
            await this.cleanup();
            if (savedConfig) {
              await new Promise((resolve) => setTimeout(resolve, 2e3));
              await this.initialize(savedConfig);
              console.log("EvoSdkService: Reconnected successfully");
              return true;
            }
          } catch (reconnectError) {
            console.error("EvoSdkService: Failed to reconnect:", reconnectError);
          }
        }
        return false;
      }
      /**
       * Get current configuration
       */
      getConfig() {
        return this.config;
      }
      /**
       * Reinitialize with new configuration
       */
      async reinitialize(config) {
        await this.cleanup();
        await this.initialize(config);
      }
    };
    evoSdkService = new EvoSdkService();
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
var require_use_sync_external_store_shim_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js"(exports) {
    "use strict";
    var React8 = __require("react");
    function is(x, y) {
      return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useState11 = React8.useState;
    var useEffect11 = React8.useEffect;
    var useLayoutEffect = React8.useLayoutEffect;
    var useDebugValue2 = React8.useDebugValue;
    function useSyncExternalStore$2(subscribe, getSnapshot) {
      var value = getSnapshot(), _useState = useState11({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
      useLayoutEffect(
        function() {
          inst.value = value;
          inst.getSnapshot = getSnapshot;
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        },
        [subscribe, value, getSnapshot]
      );
      useEffect11(
        function() {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          return subscribe(function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          });
        },
        [subscribe]
      );
      useDebugValue2(value);
      return value;
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error) {
        return true;
      }
    }
    function useSyncExternalStore$1(subscribe, getSnapshot) {
      return getSnapshot();
    }
    var shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
    exports.useSyncExternalStore = void 0 !== React8.useSyncExternalStore ? React8.useSyncExternalStore : shim;
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
var require_use_sync_external_store_shim_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      function useSyncExternalStore$2(subscribe, getSnapshot) {
        didWarnOld18Alpha || void 0 === React8.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState11({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe, value, getSnapshot]
        );
        useEffect11(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe]
        );
        useDebugValue2(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React8 = __require("react"), objectIs = "function" === typeof Object.is ? Object.is : is, useState11 = React8.useState, useEffect11 = React8.useEffect, useLayoutEffect = React8.useLayoutEffect, useDebugValue2 = React8.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      exports.useSyncExternalStore = void 0 !== React8.useSyncExternalStore ? React8.useSyncExternalStore : shim;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS({
  "node_modules/use-sync-external-store/shim/index.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module.exports = require_use_sync_external_store_shim_production();
    } else {
      module.exports = require_use_sync_external_store_shim_development();
    }
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
var require_with_selector_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js"(exports) {
    "use strict";
    var React8 = __require("react");
    var shim = require_shim();
    function is(x, y) {
      return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useSyncExternalStore = shim.useSyncExternalStore;
    var useRef = React8.useRef;
    var useEffect11 = React8.useEffect;
    var useMemo = React8.useMemo;
    var useDebugValue2 = React8.useDebugValue;
    exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
      var instRef = useRef(null);
      if (null === instRef.current) {
        var inst = { hasValue: false, value: null };
        instRef.current = inst;
      } else
        inst = instRef.current;
      instRef = useMemo(
        function() {
          function memoizedSelector(nextSnapshot) {
            if (!hasMemo) {
              hasMemo = true;
              memoizedSnapshot = nextSnapshot;
              nextSnapshot = selector(nextSnapshot);
              if (void 0 !== isEqual && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual(currentSelection, nextSnapshot))
                  return memoizedSelection = currentSelection;
              }
              return memoizedSelection = nextSnapshot;
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot))
              return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
              return memoizedSnapshot = nextSnapshot, currentSelection;
            memoizedSnapshot = nextSnapshot;
            return memoizedSelection = nextSelection;
          }
          var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
          return [
            function() {
              return memoizedSelector(getSnapshot());
            },
            null === maybeGetServerSnapshot ? void 0 : function() {
              return memoizedSelector(maybeGetServerSnapshot());
            }
          ];
        },
        [getSnapshot, getServerSnapshot, selector, isEqual]
      );
      var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
      useEffect11(
        function() {
          inst.hasValue = true;
          inst.value = value;
        },
        [value]
      );
      useDebugValue2(value);
      return value;
    };
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
var require_with_selector_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js"(exports) {
    "use strict";
    "production" !== process.env.NODE_ENV && function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React8 = __require("react"), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React8.useRef, useEffect11 = React8.useEffect, useMemo = React8.useMemo, useDebugValue2 = React8.useDebugValue;
      exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
        var instRef = useRef(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else
          inst = instRef.current;
        instRef = useMemo(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector(nextSnapshot);
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector, isEqual]
        );
        var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
        useEffect11(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue2(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS({
  "node_modules/use-sync-external-store/shim/with-selector.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module.exports = require_with_selector_production();
    } else {
      module.exports = require_with_selector_development();
    }
  }
});

// ../node_modules/base-x/src/esm/index.js
function base(ALPHABET2) {
  if (ALPHABET2.length >= 255) {
    throw new TypeError("Alphabet too long");
  }
  const BASE_MAP = new Uint8Array(256);
  for (let j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (let i = 0; i < ALPHABET2.length; i++) {
    const x = ALPHABET2.charAt(i);
    const xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + " is ambiguous");
    }
    BASE_MAP[xc] = i;
  }
  const BASE = ALPHABET2.length;
  const LEADER = ALPHABET2.charAt(0);
  const FACTOR = Math.log(BASE) / Math.log(256);
  const iFACTOR = Math.log(256) / Math.log(BASE);
  function encode(source) {
    if (source instanceof Uint8Array) {
    } else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) {
      throw new TypeError("Expected Uint8Array");
    }
    if (source.length === 0) {
      return "";
    }
    let zeroes = 0;
    let length = 0;
    let pbegin = 0;
    const pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    const size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    const b58 = new Uint8Array(size);
    while (pbegin !== pend) {
      let carry = source[pbegin];
      let i = 0;
      for (let it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i;
      pbegin++;
    }
    let it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    let str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) {
      str += ALPHABET2.charAt(b58[it2]);
    }
    return str;
  }
  function decodeUnsafe(source) {
    if (typeof source !== "string") {
      throw new TypeError("Expected String");
    }
    if (source.length === 0) {
      return new Uint8Array();
    }
    let psz = 0;
    let zeroes = 0;
    let length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    const size = (source.length - psz) * FACTOR + 1 >>> 0;
    const b256 = new Uint8Array(size);
    while (psz < source.length) {
      const charCode = source.charCodeAt(psz);
      if (charCode > 255) {
        return;
      }
      let carry = BASE_MAP[charCode];
      if (carry === 255) {
        return;
      }
      let i = 0;
      for (let it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i;
      psz++;
    }
    let it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    const vch = new Uint8Array(zeroes + (size - it4));
    let j = zeroes;
    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }
    return vch;
  }
  function decode(string) {
    const buffer = decodeUnsafe(string);
    if (buffer) {
      return buffer;
    }
    throw new Error("Non-base" + BASE + " character");
  }
  return {
    encode,
    decodeUnsafe,
    decode
  };
}
var esm_default;
var init_esm = __esm({
  "../node_modules/base-x/src/esm/index.js"() {
    esm_default = base;
  }
});

// ../node_modules/bs58/src/esm/index.js
var esm_exports = {};
__export(esm_exports, {
  default: () => esm_default2
});
var ALPHABET, esm_default2;
var init_esm2 = __esm({
  "../node_modules/bs58/src/esm/index.js"() {
    init_esm();
    ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    esm_default2 = esm_default(ALPHABET);
  }
});

// ../lib/secure-storage.ts
var secure_storage_exports = {};
__export(secure_storage_exports, {
  clearAllPrivateKeys: () => clearAllPrivateKeys,
  clearPrivateKey: () => clearPrivateKey,
  default: () => secure_storage_default,
  getPrivateKey: () => getPrivateKey,
  isRememberMe: () => isRememberMe,
  setRememberMe: () => setRememberMe,
  storePrivateKey: () => storePrivateKey
});
var SecureStorage, secureStorage, secure_storage_default, storePrivateKey, getPrivateKey, clearPrivateKey, clearAllPrivateKeys, setRememberMe, isRememberMe;
var init_secure_storage = __esm({
  "../lib/secure-storage.ts"() {
    "use strict";
    "use client";
    SecureStorage = class {
      constructor() {
        this.prefix = "yappr_secure_";
        this.rememberKey = "yappr_remember_me";
      }
      getStorage() {
        if (typeof window === "undefined")
          return null;
        const remember = localStorage.getItem(this.rememberKey) === "true";
        return remember ? localStorage : sessionStorage;
      }
      isAvailable() {
        if (typeof window === "undefined")
          return false;
        try {
          const test = "__storage_test__";
          sessionStorage.setItem(test, test);
          sessionStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Set whether to remember the session across tabs
       */
      setRememberMe(remember) {
        if (typeof window === "undefined")
          return;
        if (remember) {
          localStorage.setItem(this.rememberKey, "true");
        } else {
          localStorage.removeItem(this.rememberKey);
        }
      }
      /**
       * Check if "remember me" is enabled
       */
      isRememberMe() {
        if (typeof window === "undefined")
          return false;
        return localStorage.getItem(this.rememberKey) === "true";
      }
      /**
       * Store a value securely
       */
      set(key, value) {
        if (!this.isAvailable())
          return;
        const storage = this.getStorage();
        if (!storage)
          return;
        try {
          storage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (e) {
          console.error("SecureStorage: Failed to store value:", e);
        }
      }
      /**
       * Get a value from secure storage
       */
      get(key) {
        if (!this.isAvailable())
          return null;
        try {
          const storage = this.getStorage();
          if (!storage)
            return null;
          const item = storage.getItem(this.prefix + key);
          if (item)
            return JSON.parse(item);
          const otherStorage = this.isRememberMe() ? sessionStorage : localStorage;
          const fallback = otherStorage.getItem(this.prefix + key);
          return fallback ? JSON.parse(fallback) : null;
        } catch {
          return null;
        }
      }
      /**
       * Check if a key exists
       */
      has(key) {
        if (!this.isAvailable())
          return false;
        const storage = this.getStorage();
        if (!storage)
          return false;
        if (storage.getItem(this.prefix + key) !== null)
          return true;
        const otherStorage = this.isRememberMe() ? sessionStorage : localStorage;
        return otherStorage.getItem(this.prefix + key) !== null;
      }
      /**
       * Delete a value from secure storage
       */
      delete(key) {
        if (!this.isAvailable())
          return false;
        const existed = this.has(key);
        localStorage.removeItem(this.prefix + key);
        sessionStorage.removeItem(this.prefix + key);
        return existed;
      }
      /**
       * Clear all stored values with our prefix (from both storages)
       */
      clear() {
        if (!this.isAvailable())
          return;
        const localKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            localKeys.push(key);
          }
        }
        localKeys.forEach((key) => localStorage.removeItem(key));
        const sessionKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            sessionKeys.push(key);
          }
        }
        sessionKeys.forEach((key) => sessionStorage.removeItem(key));
        localStorage.removeItem(this.rememberKey);
      }
      /**
       * Get all keys (for debugging - should not expose actual values)
       */
      keys() {
        if (!this.isAvailable())
          return [];
        const keys = /* @__PURE__ */ new Set();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            keys.add(key.slice(this.prefix.length));
          }
        }
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith(this.prefix)) {
            keys.add(key.slice(this.prefix.length));
          }
        }
        return Array.from(keys);
      }
      /**
       * Get storage size
       */
      size() {
        return this.keys().length;
      }
    };
    secureStorage = new SecureStorage();
    secure_storage_default = secureStorage;
    storePrivateKey = (identityId, privateKey) => {
      secureStorage.set(`pk_${identityId}`, privateKey);
    };
    getPrivateKey = (identityId) => {
      return secureStorage.get(`pk_${identityId}`) || null;
    };
    clearPrivateKey = (identityId) => {
      return secureStorage.delete(`pk_${identityId}`);
    };
    clearAllPrivateKeys = () => {
      const keys = secureStorage.keys();
      keys.filter((key) => key.startsWith("pk_")).forEach((key) => {
        secureStorage.delete(key);
      });
    };
    setRememberMe = (remember) => {
      secureStorage.setRememberMe(remember);
    };
    isRememberMe = () => {
      return secureStorage.isRememberMe();
    };
  }
});

// ../lib/services/state-transition-service.ts
var StateTransitionService, stateTransitionService;
var init_state_transition_service = __esm({
  "../lib/services/state-transition-service.ts"() {
    "use strict";
    init_evo_sdk_service();
    StateTransitionService = class {
      /**
       * Get the private key from secure storage
       */
      async getPrivateKey(identityId) {
        if (typeof window === "undefined") {
          throw new Error("State transitions can only be performed in browser");
        }
        const { getPrivateKey: getPrivateKey2 } = await Promise.resolve().then(() => (init_secure_storage(), secure_storage_exports));
        const privateKey = getPrivateKey2(identityId);
        if (!privateKey) {
          throw new Error("No private key found. Please log in again.");
        }
        return privateKey;
      }
      /**
       * Generate entropy for state transitions
       */
      generateEntropy() {
        const bytes = new Uint8Array(32);
        if (typeof window !== "undefined" && window.crypto) {
          window.crypto.getRandomValues(bytes);
        } else {
          for (let i = 0; i < 32; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
          }
        }
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      }
      /**
       * Create a document
       */
      async createDocument(contractId, documentType, ownerId, documentData) {
        try {
          const sdk = await getEvoSdk();
          const privateKey = await this.getPrivateKey(ownerId);
          const entropy = this.generateEntropy();
          console.log(`Creating ${documentType} document with data:`, documentData);
          console.log(`Contract ID: ${contractId}`);
          console.log(`Owner ID: ${ownerId}`);
          const result = await sdk.documents.create({
            contractId,
            type: documentType,
            ownerId,
            data: documentData,
            entropyHex: entropy,
            privateKeyWif: privateKey
          });
          console.log("Document creation result:", result);
          return {
            success: true,
            transactionHash: result.stateTransition?.$id || result.transitionId,
            document: result.document || result
          };
        } catch (error) {
          console.error("Error creating document:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Update a document
       */
      async updateDocument(contractId, documentType, documentId, ownerId, documentData, revision) {
        try {
          const sdk = await getEvoSdk();
          const privateKey = await this.getPrivateKey(ownerId);
          console.log(`Updating ${documentType} document ${documentId}...`);
          const result = await sdk.documents.replace({
            contractId,
            type: documentType,
            documentId,
            ownerId,
            data: documentData,
            revision: BigInt(revision),
            privateKeyWif: privateKey
          });
          const doc = result.document || result;
          const normalizedDoc = {
            $id: doc.$id || doc.id,
            $ownerId: doc.$ownerId || doc.ownerId,
            $createdAt: doc.$createdAt || doc.createdAt,
            $updatedAt: doc.$updatedAt || doc.updatedAt,
            $revision: doc.$revision || doc.revision,
            ...doc.data || {}
          };
          return {
            success: true,
            transactionHash: result.stateTransition?.$id || result.transitionId,
            document: normalizedDoc
          };
        } catch (error) {
          console.error("Error updating document:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Delete a document
       */
      async deleteDocument(contractId, documentType, documentId, ownerId) {
        try {
          const sdk = await getEvoSdk();
          const privateKey = await this.getPrivateKey(ownerId);
          console.log(`Deleting ${documentType} document ${documentId}...`);
          const result = await sdk.documents.delete({
            contractId,
            type: documentType,
            documentId,
            ownerId,
            privateKeyWif: privateKey
          });
          return {
            success: true,
            transactionHash: result.stateTransition?.$id || result.transitionId
          };
        } catch (error) {
          console.error("Error deleting document:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Wait for a state transition to be confirmed
       */
      async waitForConfirmation(transactionHash, options = {}) {
        const {
          maxWaitTimeMs = 1e4,
          // 10 seconds max wait (reduced from 30s)
          pollingIntervalMs = 2e3,
          // Poll every 2 seconds
          onProgress
        } = options;
        const startTime = Date.now();
        let attempt = 0;
        try {
          const sdk = await getEvoSdk();
          console.log(`Waiting for transaction confirmation: ${transactionHash}`);
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Wait timeout")), 8e3);
            });
            const result = await Promise.race([
              sdk.wasm.waitForStateTransitionResult(transactionHash),
              timeoutPromise
            ]);
            if (result) {
              console.log("Transaction confirmed via wait_for_state_transition_result:", result);
              return { success: true, result };
            }
          } catch (waitError) {
            console.log("wait_for_state_transition_result timed out (expected):", waitError);
          }
          console.log("Transaction broadcast successfully. Assuming confirmation due to known DAPI timeout issue.");
          console.log("Note: The transaction is likely confirmed on the network despite the timeout.");
          return {
            success: true,
            result: {
              assumed: true,
              reason: "DAPI wait timeout is a known issue - transaction likely succeeded",
              transactionHash
            }
          };
        } catch (error) {
          console.error("Error waiting for confirmation:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      /**
       * Create document with confirmation
       */
      async createDocumentWithConfirmation(contractId, documentType, ownerId, documentData, waitForConfirmation = false) {
        const result = await this.createDocument(contractId, documentType, ownerId, documentData);
        if (!result.success || !waitForConfirmation || !result.transactionHash) {
          return result;
        }
        console.log("Waiting for transaction confirmation...");
        const confirmation = await this.waitForConfirmation(result.transactionHash, {
          onProgress: (attempt, elapsed) => {
            console.log(`Confirmation attempt ${attempt}, elapsed: ${Math.round(elapsed / 1e3)}s`);
          }
        });
        return {
          ...result,
          confirmed: confirmation.success
        };
      }
    };
    stateTransitionService = new StateTransitionService();
  }
});

// ../lib/services/sdk-helpers.ts
function identifierToBase58(value) {
  if (!value)
    return null;
  if (typeof value === "string") {
    try {
      const decoded = esm_default2.decode(value);
      return esm_default2.encode(decoded);
    } catch {
    }
    if (value.includes("+") || value.includes("/") || value.endsWith("=")) {
      try {
        const bytes = base64ToBytes(value);
        if (bytes.length === 32) {
          return esm_default2.encode(bytes);
        }
      } catch {
      }
    }
    if (/^[0-9a-fA-F]+$/.test(value) && value.length === 64) {
      try {
        const bytes = hexToBytes(value);
        return esm_default2.encode(bytes);
      } catch {
      }
    }
    return null;
  }
  if (value instanceof Uint8Array) {
    return esm_default2.encode(value);
  }
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return esm_default2.encode(new Uint8Array(value));
  }
  const obj = value;
  if (typeof obj.toBuffer === "function") {
    return esm_default2.encode(obj.toBuffer());
  }
  if (obj.bytes instanceof Uint8Array) {
    return esm_default2.encode(obj.bytes);
  }
  if (typeof obj.toJSON === "function") {
    const json = obj.toJSON();
    if (json instanceof Uint8Array) {
      return esm_default2.encode(json);
    }
    if (Array.isArray(json) && json.every((n) => typeof n === "number")) {
      return esm_default2.encode(new Uint8Array(json));
    }
  }
  return null;
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
function base64ToBytes(base64) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
}
async function queryDocuments(sdk, options) {
  const query = {
    dataContractId: options.dataContractId,
    documentTypeName: options.documentTypeName
  };
  if (options.where) {
    query.where = options.where;
  }
  if (options.orderBy) {
    query.orderBy = options.orderBy;
  }
  if (options.limit) {
    query.limit = options.limit;
  }
  if (options.startAfter) {
    query.startAfter = options.startAfter;
  }
  if (options.startAt) {
    query.startAt = options.startAt;
  }
  const response = await sdk.documents.query(query);
  return mapToDocumentArray(response);
}
function mapToDocumentArray(response) {
  const documents = [];
  const values = Array.from(response.values());
  for (const doc of values) {
    if (doc) {
      const data = typeof doc.toJSON === "function" ? doc.toJSON() : doc;
      documents.push(data);
    }
  }
  return documents;
}
var init_sdk_helpers = __esm({
  "../lib/services/sdk-helpers.ts"() {
    "use strict";
    init_esm2();
  }
});

// ../lib/services/document-service.ts
var BaseDocumentService;
var init_document_service = __esm({
  "../lib/services/document-service.ts"() {
    "use strict";
    init_evo_sdk_service();
    init_state_transition_service();
    init_constants();
    init_sdk_helpers();
    BaseDocumentService = class {
      // 2 minutes cache (reduced query frequency)
      constructor(documentType, contractId) {
        this.cache = /* @__PURE__ */ new Map();
        this.CACHE_TTL = 12e4;
        this.contractId = contractId ?? YAPPR_CONTRACT_ID;
        this.documentType = documentType;
      }
      /**
       * Query documents
       */
      async query(options = {}) {
        try {
          const sdk = await getEvoSdk();
          console.log(`Querying ${this.documentType} documents:`, {
            dataContractId: this.contractId,
            documentTypeName: this.documentType,
            ...options
          });
          const rawDocuments = await queryDocuments(sdk, {
            dataContractId: this.contractId,
            documentTypeName: this.documentType,
            where: options.where,
            orderBy: options.orderBy,
            limit: options.limit,
            startAfter: options.startAfter,
            startAt: options.startAt
          });
          console.log(`${this.documentType} query returned ${rawDocuments.length} documents`);
          const documents = rawDocuments.map((doc) => this.transformDocument(doc));
          return {
            documents,
            nextCursor: void 0,
            prevCursor: void 0
          };
        } catch (error) {
          console.error(`Error querying ${this.documentType} documents:`, error);
          throw error;
        }
      }
      /**
       * Get a single document by ID
       */
      async get(documentId) {
        try {
          const cached = this.cache.get(documentId);
          if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
          }
          const sdk = await getEvoSdk();
          const response = await sdk.documents.get(
            this.contractId,
            this.documentType,
            documentId
          );
          if (!response) {
            return null;
          }
          const docData = typeof response.toJSON === "function" ? response.toJSON() : response;
          const transformed = this.transformDocument(docData);
          this.cache.set(documentId, {
            data: transformed,
            timestamp: Date.now()
          });
          return transformed;
        } catch (error) {
          console.error(`Error getting ${this.documentType} document:`, error);
          return null;
        }
      }
      /**
       * Create a new document
       */
      async create(ownerId, data) {
        try {
          console.log(`Creating ${this.documentType} document:`, data);
          const result = await stateTransitionService.createDocument(
            this.contractId,
            this.documentType,
            ownerId,
            data
          );
          if (!result.success) {
            throw new Error(result.error || "Failed to create document");
          }
          this.clearCache();
          return this.transformDocument(result.document);
        } catch (error) {
          console.error(`Error creating ${this.documentType} document:`, error);
          throw error;
        }
      }
      /**
       * Update a document
       */
      async update(documentId, ownerId, data) {
        try {
          console.log(`Updating ${this.documentType} document ${documentId}:`, data);
          this.cache.delete(documentId);
          const currentDoc = await this.get(documentId);
          if (!currentDoc) {
            throw new Error("Document not found");
          }
          const revision = currentDoc.$revision || 0;
          console.log(`Current revision for ${this.documentType} document ${documentId}: ${revision}`);
          const result = await stateTransitionService.updateDocument(
            this.contractId,
            this.documentType,
            documentId,
            ownerId,
            data,
            revision
          );
          if (!result.success) {
            throw new Error(result.error || "Failed to update document");
          }
          this.cache.delete(documentId);
          return this.transformDocument(result.document);
        } catch (error) {
          console.error(`Error updating ${this.documentType} document:`, error);
          throw error;
        }
      }
      /**
       * Delete a document
       */
      async delete(documentId, ownerId) {
        try {
          console.log(`Deleting ${this.documentType} document ${documentId}`);
          const result = await stateTransitionService.deleteDocument(
            this.contractId,
            this.documentType,
            documentId,
            ownerId
          );
          if (!result.success) {
            throw new Error(result.error || "Failed to delete document");
          }
          this.cache.delete(documentId);
          return true;
        } catch (error) {
          console.error(`Error deleting ${this.documentType} document:`, error);
          return false;
        }
      }
      /**
       * Clear cache
       */
      clearCache(documentId) {
        if (documentId) {
          this.cache.delete(documentId);
        } else {
          this.cache.clear();
        }
      }
      /**
       * Clean up expired cache entries
       */
      cleanupCache() {
        const now = Date.now();
        for (const [key, value] of Array.from(this.cache.entries())) {
          if (now - value.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
          }
        }
      }
    };
  }
});

// ../lib/services/follow-service.ts
var follow_service_exports = {};
__export(follow_service_exports, {
  followService: () => followService
});
var FollowService, followService;
var init_follow_service = __esm({
  "../lib/services/follow-service.ts"() {
    "use strict";
    init_document_service();
    init_state_transition_service();
    init_sdk_helpers();
    init_evo_sdk_service();
    FollowService = class extends BaseDocumentService {
      constructor() {
        super("follow");
        // In-flight request deduplication: multiple callers share the same promise
        this.inFlightFollowing = /* @__PURE__ */ new Map();
        this.inFlightCountFollowers = /* @__PURE__ */ new Map();
        this.inFlightCountFollowing = /* @__PURE__ */ new Map();
      }
      /**
       * Transform document
       * SDK v3: System fields ($id, $ownerId) are base58, byte array fields (followingId) are base64
       */
      transformDocument(doc) {
        const data = doc.data || doc;
        const rawFollowingId = data.followingId;
        const followingId = rawFollowingId ? identifierToBase58(rawFollowingId) : "";
        if (rawFollowingId && !followingId) {
          console.error("FollowService: Invalid followingId format:", rawFollowingId);
        }
        return {
          $id: doc.$id || doc.id,
          $ownerId: doc.$ownerId || doc.ownerId,
          $createdAt: doc.$createdAt || doc.createdAt,
          followingId: followingId || ""
        };
      }
      /**
       * Follow a user
       */
      async followUser(followerUserId, targetUserId) {
        try {
          const existing = await this.getFollow(targetUserId, followerUserId);
          if (existing) {
            console.log("Already following user");
            return { success: true };
          }
          const bs58Module = await Promise.resolve().then(() => (init_esm2(), esm_exports));
          const bs58 = bs58Module.default;
          const followingIdBytes = Array.from(bs58.decode(targetUserId));
          const result = await stateTransitionService.createDocument(
            this.contractId,
            this.documentType,
            followerUserId,
            { followingId: followingIdBytes }
          );
          return result;
        } catch (error) {
          console.error("Error following user:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to follow user"
          };
        }
      }
      /**
       * Unfollow a user
       */
      async unfollowUser(followerUserId, targetUserId) {
        try {
          const follow = await this.getFollow(targetUserId, followerUserId);
          if (!follow) {
            console.log("Not following user");
            return { success: true };
          }
          const result = await stateTransitionService.deleteDocument(
            this.contractId,
            this.documentType,
            follow.$id,
            followerUserId
          );
          return result;
        } catch (error) {
          console.error("Error unfollowing user:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to unfollow user"
          };
        }
      }
      /**
       * Check if user A follows user B.
       * Uses getFollowingIds() which deduplicates in-flight requests,
       * so multiple calls share 1 network request.
       */
      async isFollowing(targetUserId, followerUserId) {
        if (!followerUserId || !targetUserId)
          return false;
        const followingIds = await this.getFollowingIds(followerUserId);
        return followingIds.includes(targetUserId);
      }
      /**
       * Get follow relationship
       */
      async getFollow(targetUserId, followerUserId) {
        try {
          const result = await this.query({
            where: [
              ["$ownerId", "==", followerUserId],
              ["followingId", "==", targetUserId]
            ],
            limit: 1
          });
          return result.documents.length > 0 ? result.documents[0] : null;
        } catch (error) {
          console.error("Error getting follow:", error);
          return null;
        }
      }
      /**
       * Get followers of a user
       */
      async getFollowers(userId, options = {}) {
        try {
          const result = await this.query({
            where: [["followingId", "==", userId]],
            orderBy: [["$createdAt", "asc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting followers:", error);
          return [];
        }
      }
      /**
       * Get users that a user follows
       */
      async getFollowing(userId, options = {}) {
        try {
          const result = await this.query({
            where: [["$ownerId", "==", userId]],
            orderBy: [["$createdAt", "asc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting following:", error);
          return [];
        }
      }
      /**
       * Get array of following user IDs.
       * Deduplicates in-flight requests: if called multiple times before the first
       * request completes, all callers share the same promise/network request.
       */
      async getFollowingIds(userId) {
        if (!userId)
          return [];
        const inFlight = this.inFlightFollowing.get(userId);
        if (inFlight) {
          return inFlight;
        }
        const promise = this.getFollowing(userId, { limit: 100 }).then((following) => following.map((f) => f.followingId)).finally(() => {
          setTimeout(() => this.inFlightFollowing.delete(userId), 100);
        });
        this.inFlightFollowing.set(userId, promise);
        return promise;
      }
      /**
       * Batch check if the current user follows any of the target users.
       * Efficient: reuses getFollowingIds (1 query, deduplicated) then does Set intersection.
       * @returns Map of targetUserId -> isFollowing
       */
      async getFollowStatusBatch(targetUserIds, followerId) {
        const result = /* @__PURE__ */ new Map();
        for (const id of targetUserIds) {
          result.set(id, false);
        }
        if (!followerId || targetUserIds.length === 0) {
          return result;
        }
        try {
          const followingIds = await this.getFollowingIds(followerId);
          const followingSet = new Set(followingIds);
          for (const targetId of targetUserIds) {
            result.set(targetId, followingSet.has(targetId));
          }
        } catch (error) {
          console.error("Error getting batch follow status:", error);
        }
        return result;
      }
      /**
       * Count followers - uses queryDocuments helper.
       * Deduplicates in-flight requests.
       */
      async countFollowers(userId) {
        const inFlight = this.inFlightCountFollowers.get(userId);
        if (inFlight) {
          return inFlight;
        }
        const promise = this.fetchCountFollowers(userId);
        this.inFlightCountFollowers.set(userId, promise);
        promise.finally(() => {
          setTimeout(() => this.inFlightCountFollowers.delete(userId), 100);
        });
        return promise;
      }
      async fetchCountFollowers(userId) {
        try {
          const sdk = await getEvoSdk();
          const documents = await queryDocuments(sdk, {
            dataContractId: this.contractId,
            documentTypeName: "follow",
            where: [
              ["followingId", "==", userId],
              ["$createdAt", ">", 0]
            ],
            orderBy: [["$createdAt", "asc"]],
            limit: 100
          });
          return documents.length;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Error counting followers:", errorMessage, error);
          return 0;
        }
      }
      /**
       * Count following - uses queryDocuments helper.
       * Deduplicates in-flight requests.
       */
      async countFollowing(userId) {
        const inFlight = this.inFlightCountFollowing.get(userId);
        if (inFlight) {
          return inFlight;
        }
        const promise = this.fetchCountFollowing(userId);
        this.inFlightCountFollowing.set(userId, promise);
        promise.finally(() => {
          setTimeout(() => this.inFlightCountFollowing.delete(userId), 100);
        });
        return promise;
      }
      async fetchCountFollowing(userId) {
        try {
          const sdk = await getEvoSdk();
          const documents = await queryDocuments(sdk, {
            dataContractId: this.contractId,
            documentTypeName: "follow",
            where: [["$ownerId", "==", userId]],
            orderBy: [["$createdAt", "asc"]],
            limit: 100
          });
          return documents.length;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Error counting following:", errorMessage, error);
          return 0;
        }
      }
      /**
       * Check mutual follow (both users follow each other)
       */
      async areMutualFollowers(userId1, userId2) {
        const [follows1to2, follows2to1] = await Promise.all([
          this.isFollowing(userId2, userId1),
          this.isFollowing(userId1, userId2)
        ]);
        return follows1to2 && follows2to1;
      }
    };
    followService = new FollowService();
  }
});

// ../lib/services/like-service.ts
var like_service_exports = {};
__export(like_service_exports, {
  likeService: () => likeService
});
var LikeService, likeService;
var init_like_service = __esm({
  "../lib/services/like-service.ts"() {
    "use strict";
    init_document_service();
    init_state_transition_service();
    init_sdk_helpers();
    LikeService = class extends BaseDocumentService {
      constructor() {
        super("like");
        // In-flight request deduplication
        this.inFlightCountUserLikes = /* @__PURE__ */ new Map();
      }
      /**
       * Transform document
       * SDK v3: System fields ($id, $ownerId) are base58, byte array fields (postId) are base64
       */
      transformDocument(doc) {
        const data = doc.data || doc;
        const rawPostId = data.postId || doc.postId;
        const postId = rawPostId ? identifierToBase58(rawPostId) : "";
        if (rawPostId && !postId) {
          console.error("LikeService: Invalid postId format:", rawPostId);
        }
        return {
          $id: doc.$id || doc.id,
          $ownerId: doc.$ownerId || doc.ownerId,
          $createdAt: doc.$createdAt || doc.createdAt,
          postId: postId || ""
        };
      }
      /**
       * Like a post
       */
      async likePost(postId, ownerId) {
        try {
          const existing = await this.getLike(postId, ownerId);
          if (existing) {
            console.log("Post already liked");
            return true;
          }
          const bs58Module = await Promise.resolve().then(() => (init_esm2(), esm_exports));
          const bs58 = bs58Module.default;
          const postIdBytes = Array.from(bs58.decode(postId));
          const result = await stateTransitionService.createDocument(
            this.contractId,
            this.documentType,
            ownerId,
            { postId: postIdBytes }
          );
          return result.success;
        } catch (error) {
          console.error("Error liking post:", error);
          return false;
        }
      }
      /**
       * Unlike a post
       */
      async unlikePost(postId, ownerId) {
        try {
          const like = await this.getLike(postId, ownerId);
          if (!like) {
            console.log("Post not liked");
            return true;
          }
          const result = await stateTransitionService.deleteDocument(
            this.contractId,
            this.documentType,
            like.$id,
            ownerId
          );
          return result.success;
        } catch (error) {
          console.error("Error unliking post:", error);
          return false;
        }
      }
      /**
       * Check if post is liked by user
       */
      async isLiked(postId, ownerId) {
        const like = await this.getLike(postId, ownerId);
        return like !== null;
      }
      /**
       * Get like by post and owner
       */
      async getLike(postId, ownerId) {
        try {
          const sdk = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports)).then((m) => m.getEvoSdk());
          const where = [
            ["postId", "==", postId],
            ["$ownerId", "==", ownerId]
          ];
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: "like",
            where,
            limit: 1
          });
          let documents;
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (response && typeof response.toJSON === "function") {
            documents = response.toJSON();
          } else if (response && response.documents) {
            documents = response.documents;
          } else if (Array.isArray(response)) {
            documents = response;
          } else {
            documents = [];
          }
          return documents.length > 0 ? this.transformDocument(documents[0]) : null;
        } catch (error) {
          console.error("Error getting like:", error);
          return null;
        }
      }
      /**
       * Get likes for a post
       */
      async getPostLikes(postId, options = {}) {
        try {
          const sdk = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports)).then((m) => m.getEvoSdk());
          const where = [
            ["postId", "==", postId],
            ["$createdAt", ">", 0]
          ];
          const orderBy = [["$createdAt", "asc"]];
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: "like",
            where,
            orderBy,
            limit: options.limit || 50
          });
          let documents;
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (response && typeof response.toJSON === "function") {
            documents = response.toJSON();
          } else if (response && response.documents) {
            documents = response.documents;
          } else if (Array.isArray(response)) {
            documents = response;
          } else {
            documents = [];
          }
          return documents.map((doc) => this.transformDocument(doc));
        } catch (error) {
          console.error("Error getting post likes:", error);
          return [];
        }
      }
      /**
       * Get user's likes
       */
      async getUserLikes(userId, options = {}) {
        try {
          const result = await this.query({
            where: [
              ["$ownerId", "==", userId],
              ["$createdAt", ">", 0]
            ],
            orderBy: [["$createdAt", "asc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting user likes:", error);
          return [];
        }
      }
      /**
       * Count likes given by a user - uses direct SDK query for reliability.
       * Deduplicates in-flight requests.
       */
      async countUserLikes(userId) {
        const inFlight = this.inFlightCountUserLikes.get(userId);
        if (inFlight) {
          return inFlight;
        }
        const promise = this.fetchCountUserLikes(userId);
        this.inFlightCountUserLikes.set(userId, promise);
        promise.finally(() => {
          setTimeout(() => this.inFlightCountUserLikes.delete(userId), 100);
        });
        return promise;
      }
      async fetchCountUserLikes(userId) {
        try {
          const sdk = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports)).then((m) => m.getEvoSdk());
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: "like",
            where: [
              ["$ownerId", "==", userId],
              ["$createdAt", ">", 0]
            ],
            orderBy: [["$createdAt", "asc"]],
            limit: 100
          });
          let documents;
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (Array.isArray(response)) {
            documents = response;
          } else if (response && response.documents) {
            documents = response.documents;
          } else if (response && typeof response.toJSON === "function") {
            const json = response.toJSON();
            documents = Array.isArray(json) ? json : json.documents || [];
          } else {
            documents = [];
          }
          return documents.length;
        } catch (error) {
          console.error("Error counting user likes:", error);
          return 0;
        }
      }
      /**
       * Count likes for a post
       */
      async countLikes(postId) {
        const likes = await this.getPostLikes(postId);
        return likes.length;
      }
      /**
       * Get likes for multiple posts in a single batch query
       * Uses 'in' operator for efficient querying
       */
      async getLikesByPostIds(postIds) {
        if (postIds.length === 0)
          return [];
        try {
          const sdk = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports)).then((m) => m.getEvoSdk());
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: "like",
            where: [["postId", "in", postIds]],
            orderBy: [["postId", "asc"]],
            limit: 100
          });
          let documents = [];
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (Array.isArray(response)) {
            documents = response;
          } else if (response && response.documents) {
            documents = response.documents;
          } else if (response && typeof response.toJSON === "function") {
            const json = response.toJSON();
            documents = Array.isArray(json) ? json : json.documents || [];
          }
          return documents.map((doc) => this.transformDocument(doc));
        } catch (error) {
          console.error("Error getting likes batch:", error);
          return [];
        }
      }
    };
    likeService = new LikeService();
  }
});

// ../lib/services/repost-service.ts
var repost_service_exports = {};
__export(repost_service_exports, {
  repostService: () => repostService
});
var RepostService, repostService;
var init_repost_service = __esm({
  "../lib/services/repost-service.ts"() {
    "use strict";
    init_document_service();
    init_state_transition_service();
    init_sdk_helpers();
    RepostService = class extends BaseDocumentService {
      constructor() {
        super("repost");
      }
      /**
       * Transform document
       * SDK v3: System fields ($id, $ownerId) are base58, byte array fields (postId) are base64
       */
      transformDocument(doc) {
        const data = doc.data || doc;
        const rawPostId = data.postId || doc.postId;
        const postId = rawPostId ? identifierToBase58(rawPostId) : "";
        if (rawPostId && !postId) {
          console.error("RepostService: Invalid postId format:", rawPostId);
        }
        return {
          $id: doc.$id || doc.id,
          $ownerId: doc.$ownerId || doc.ownerId,
          $createdAt: doc.$createdAt || doc.createdAt,
          postId: postId || ""
        };
      }
      /**
       * Repost a post
       */
      async repostPost(postId, ownerId) {
        try {
          const existing = await this.getRepost(postId, ownerId);
          if (existing) {
            console.log("Post already reposted");
            return true;
          }
          const bs58Module = await Promise.resolve().then(() => (init_esm2(), esm_exports));
          const bs58 = bs58Module.default;
          const postIdBytes = Array.from(bs58.decode(postId));
          const result = await stateTransitionService.createDocument(
            this.contractId,
            this.documentType,
            ownerId,
            { postId: postIdBytes }
          );
          return result.success;
        } catch (error) {
          console.error("Error reposting:", error);
          return false;
        }
      }
      /**
       * Remove repost
       */
      async removeRepost(postId, ownerId) {
        try {
          const repost = await this.getRepost(postId, ownerId);
          if (!repost) {
            console.log("Post not reposted");
            return true;
          }
          const result = await stateTransitionService.deleteDocument(
            this.contractId,
            this.documentType,
            repost.$id,
            ownerId
          );
          return result.success;
        } catch (error) {
          console.error("Error removing repost:", error);
          return false;
        }
      }
      /**
       * Check if post is reposted by user
       */
      async isReposted(postId, ownerId) {
        const repost = await this.getRepost(postId, ownerId);
        return repost !== null;
      }
      /**
       * Get repost by post and owner
       */
      async getRepost(postId, ownerId) {
        try {
          const result = await this.query({
            where: [
              ["postId", "==", postId],
              ["$ownerId", "==", ownerId]
            ],
            limit: 1
          });
          return result.documents.length > 0 ? result.documents[0] : null;
        } catch (error) {
          console.error("Error getting repost:", error);
          return null;
        }
      }
      /**
       * Get reposts for a post
       */
      async getPostReposts(postId, options = {}) {
        try {
          const result = await this.query({
            where: [
              ["postId", "==", postId],
              ["$createdAt", ">", 0]
            ],
            orderBy: [["$createdAt", "asc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting post reposts:", error);
          return [];
        }
      }
      /**
       * Get user's reposts
       */
      async getUserReposts(userId, options = {}) {
        try {
          const result = await this.query({
            where: [
              ["$ownerId", "==", userId],
              ["$createdAt", ">", 0]
            ],
            orderBy: [["$createdAt", "asc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting user reposts:", error);
          return [];
        }
      }
      /**
       * Count reposts for a post
       */
      async countReposts(postId) {
        const reposts = await this.getPostReposts(postId);
        return reposts.length;
      }
      /**
       * Get reposts for multiple posts in a single batch query
       * Uses 'in' operator for efficient querying
       */
      async getRepostsByPostIds(postIds) {
        if (postIds.length === 0)
          return [];
        try {
          const sdk = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports)).then((m) => m.getEvoSdk());
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: "repost",
            where: [["postId", "in", postIds]],
            orderBy: [["postId", "asc"]],
            limit: 100
          });
          let documents = [];
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (Array.isArray(response)) {
            documents = response;
          } else if (response && response.documents) {
            documents = response.documents;
          } else if (response && typeof response.toJSON === "function") {
            const json = response.toJSON();
            documents = Array.isArray(json) ? json : json.documents || [];
          }
          return documents.map((doc) => this.transformDocument(doc));
        } catch (error) {
          console.error("Error getting reposts batch:", error);
          return [];
        }
      }
    };
    repostService = new RepostService();
  }
});

// ../lib/services/bookmark-service.ts
var bookmark_service_exports = {};
__export(bookmark_service_exports, {
  bookmarkService: () => bookmarkService
});
var BookmarkService, bookmarkService;
var init_bookmark_service = __esm({
  "../lib/services/bookmark-service.ts"() {
    "use strict";
    init_document_service();
    init_state_transition_service();
    init_sdk_helpers();
    BookmarkService = class extends BaseDocumentService {
      constructor() {
        super("bookmark");
      }
      /**
       * Transform document
       * SDK v3: System fields ($id, $ownerId) are base58, byte array fields (postId) are base64
       */
      transformDocument(doc) {
        const data = doc.data || doc;
        const rawPostId = data.postId || doc.postId;
        const postId = rawPostId ? identifierToBase58(rawPostId) : "";
        if (rawPostId && !postId) {
          console.error("BookmarkService: Invalid postId format:", rawPostId);
        }
        return {
          $id: doc.$id || doc.id,
          $ownerId: doc.$ownerId || doc.ownerId,
          $createdAt: doc.$createdAt || doc.createdAt,
          postId: postId || ""
        };
      }
      /**
       * Bookmark a post
       */
      async bookmarkPost(postId, ownerId) {
        try {
          const existing = await this.getBookmark(postId, ownerId);
          if (existing) {
            console.log("Post already bookmarked");
            return true;
          }
          const result = await stateTransitionService.createDocument(
            this.contractId,
            this.documentType,
            ownerId,
            { postId }
          );
          return result.success;
        } catch (error) {
          console.error("Error bookmarking post:", error);
          return false;
        }
      }
      /**
       * Remove bookmark
       */
      async removeBookmark(postId, ownerId) {
        try {
          const bookmark = await this.getBookmark(postId, ownerId);
          if (!bookmark) {
            console.log("Post not bookmarked");
            return true;
          }
          const result = await stateTransitionService.deleteDocument(
            this.contractId,
            this.documentType,
            bookmark.$id,
            ownerId
          );
          return result.success;
        } catch (error) {
          console.error("Error removing bookmark:", error);
          return false;
        }
      }
      /**
       * Check if post is bookmarked by user
       */
      async isBookmarked(postId, ownerId) {
        const bookmark = await this.getBookmark(postId, ownerId);
        return bookmark !== null;
      }
      /**
       * Get bookmark by post and owner
       */
      async getBookmark(postId, ownerId) {
        try {
          const result = await this.query({
            where: [
              ["postId", "==", postId],
              ["$ownerId", "==", ownerId]
            ],
            limit: 1
          });
          return result.documents.length > 0 ? result.documents[0] : null;
        } catch (error) {
          console.error("Error getting bookmark:", error);
          return null;
        }
      }
      /**
       * Get user's bookmarks
       */
      async getUserBookmarks(userId, options = {}) {
        try {
          const result = await this.query({
            where: [["$ownerId", "==", userId]],
            orderBy: [["$createdAt", "desc"]],
            limit: 50,
            ...options
          });
          return result.documents;
        } catch (error) {
          console.error("Error getting user bookmarks:", error);
          return [];
        }
      }
      /**
       * Count bookmarks for a user
       */
      async countUserBookmarks(userId) {
        const bookmarks = await this.getUserBookmarks(userId);
        return bookmarks.length;
      }
    };
    bookmarkService = new BookmarkService();
  }
});

// src/index.tsx
import { render } from "ink";

// src/services/cli-sdk.ts
init_evo_sdk_service();
init_constants();
var CliSdkService = class {
  initialized = false;
  quiet = false;
  async initialize(config = {}) {
    if (this.initialized)
      return;
    this.quiet = config.quiet ?? false;
    const network = config.network ?? process.env.YAPPR_NETWORK ?? DEFAULT_NETWORK;
    const contractId = config.contractId ?? process.env.YAPPR_CONTRACT_ID ?? YAPPR_CONTRACT_ID;
    if (!this.quiet) {
      console.log(`Connecting to Dash Platform (${network})...`);
    }
    await evoSdkService.initialize({ network, contractId });
    this.initialized = true;
    if (!this.quiet) {
      console.log("Connected.");
    }
  }
  isReady() {
    return this.initialized && evoSdkService.isReady();
  }
  async cleanup() {
    await evoSdkService.cleanup();
    this.initialized = false;
  }
};
var cliSdkService = new CliSdkService();

// src/app.tsx
import { useEffect as useEffect10 } from "react";
import { Box as Box18, useApp, useInput as useInput10 } from "ink";

// node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

// node_modules/zustand/esm/index.mjs
var import_with_selector = __toESM(require_with_selector(), 1);
import ReactExports from "react";
var { useDebugValue } = ReactExports;
var { useSyncExternalStoreWithSelector } = import_with_selector.default;
var didWarnAboutEqualityFn = false;
var identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
  if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
var createImpl = (createState) => {
  if ((import.meta.env ? import.meta.env.MODE : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
var create = (createState) => createState ? createImpl(createState) : createImpl;

// src/store/navigation.ts
var useNavigation = create((set, get) => ({
  stack: [],
  current: { screen: "timeline", params: {} },
  selectedIndex: 0,
  activeTab: 0,
  push: (screen, params = {}) => {
    const { current, stack } = get();
    set({
      stack: [...stack, current],
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0
    });
  },
  pop: () => {
    const { stack } = get();
    if (stack.length === 0)
      return false;
    const newStack = [...stack];
    const prev = newStack.pop();
    set({
      stack: newStack,
      current: prev,
      selectedIndex: 0,
      activeTab: 0
    });
    return true;
  },
  replace: (screen, params = {}) => {
    set({
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0
    });
  },
  reset: (screen = "timeline", params = {}) => {
    set({
      stack: [],
      current: { screen, params },
      selectedIndex: 0,
      activeTab: 0
    });
  },
  setSelectedIndex: (index) => {
    set({ selectedIndex: Math.max(0, index) });
  },
  moveSelection: (delta, maxIndex) => {
    const { selectedIndex } = get();
    const newIndex = Math.max(0, Math.min(maxIndex, selectedIndex + delta));
    set({ selectedIndex: newIndex });
  },
  setActiveTab: (tab) => {
    set({ activeTab: tab, selectedIndex: 0 });
  }
}));

// src/services/cli-identity.ts
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ../lib/services/dpns-service.ts
init_evo_sdk_service();
init_constants();
init_esm2();
var DpnsService = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    this.reverseCache = /* @__PURE__ */ new Map();
    this.CACHE_TTL = 36e5;
  }
  // 1 hour cache for DPNS
  /**
   * Convert a value to base58 string.
   * Handles base64 strings (from SDK v3 toJSON), Uint8Array, and number arrays.
   */
  toBase58String(value) {
    if (typeof value === "string") {
      try {
        const decoded = esm_default2.decode(value);
        if (decoded.length === 32) {
          return value;
        }
      } catch {
      }
      if (value.includes("+") || value.includes("/") || value.endsWith("=")) {
        try {
          const bytes = this.base64ToBytes(value);
          if (bytes.length === 32) {
            return esm_default2.encode(bytes);
          }
        } catch {
        }
      }
      return null;
    }
    if (value instanceof Uint8Array) {
      return esm_default2.encode(value);
    }
    if (Array.isArray(value)) {
      return esm_default2.encode(new Uint8Array(value));
    }
    return null;
  }
  /**
   * Convert base64 string to bytes
   */
  base64ToBytes(base64) {
    if (typeof atob === "function") {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } else {
      return new Uint8Array(Buffer.from(base64, "base64"));
    }
  }
  /**
   * Helper method to cache entries in both directions
   */
  _cacheEntry(username, identityId) {
    const now = Date.now();
    this.cache.set(username.toLowerCase(), { value: identityId, timestamp: now });
    this.reverseCache.set(identityId, { value: username, timestamp: now });
  }
  /**
   * Get all usernames for an identity ID
   */
  async getAllUsernames(identityId) {
    try {
      console.log(`DPNS: Fetching all usernames for identity: ${identityId}`);
      const sdk = await getEvoSdk();
      try {
        const usernames = await sdk.dpns.usernames({ identityId, limit: 20 });
        console.log("DPNS: Usernames response:", usernames);
        if (usernames && usernames.length > 0) {
          console.log(`DPNS: Found ${usernames.length} usernames for identity ${identityId}`);
          return usernames;
        }
      } catch (error) {
        console.warn("DPNS: sdk.dpns.usernames failed, trying document query:", error);
      }
      const response = await sdk.documents.query({
        dataContractId: DPNS_CONTRACT_ID,
        documentTypeName: DPNS_DOCUMENT_TYPE,
        where: [["records.identity", "==", identityId]],
        limit: 20
      });
      if (response instanceof Map) {
        const docs = Array.from(response.values()).filter(Boolean);
        if (docs.length > 0) {
          const usernames = docs.map((doc) => {
            const docData = typeof doc.toJSON === "function" ? doc.toJSON() : doc;
            return `${docData.label}.${docData.normalizedParentDomainName}`;
          });
          console.log(`DPNS: Found ${usernames.length} usernames for identity ${identityId} via document query`);
          return usernames;
        }
      } else if (response && response.documents && response.documents.length > 0) {
        const usernames = response.documents.map(
          (doc) => `${doc.label}.${doc.normalizedParentDomainName}`
        );
        console.log(`DPNS: Found ${usernames.length} usernames for identity ${identityId} via document query`);
        return usernames;
      }
      console.log(`DPNS: No usernames found for identity ${identityId}`);
      return [];
    } catch (error) {
      console.error("DPNS: Error fetching all usernames:", error);
      return [];
    }
  }
  /**
   * Sort usernames by contested status (contested usernames first)
   */
  async sortUsernamesByContested(usernames) {
    const sdk = await getEvoSdk();
    const contestedStatuses = await Promise.all(
      usernames.map(async (u) => ({
        username: u,
        contested: await sdk.dpns.isContestedUsername(u.split(".")[0])
      }))
    );
    return contestedStatuses.sort((a, b) => {
      if (a.contested && !b.contested)
        return -1;
      if (!a.contested && b.contested)
        return 1;
      return a.username.localeCompare(b.username);
    }).map((item) => item.username);
  }
  /**
   * Batch resolve usernames for multiple identity IDs (reverse lookup)
   * Uses 'in' operator for efficient single-query resolution
   */
  async resolveUsernamesBatch(identityIds) {
    const results = /* @__PURE__ */ new Map();
    identityIds.forEach((id) => results.set(id, null));
    if (identityIds.length === 0)
      return results;
    const uncachedIds = [];
    for (const id of identityIds) {
      const cached = this.reverseCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results.set(id, cached.value);
      } else {
        uncachedIds.push(id);
      }
    }
    if (uncachedIds.length === 0) {
      return results;
    }
    try {
      const sdk = await getEvoSdk();
      const response = await sdk.documents.query({
        dataContractId: DPNS_CONTRACT_ID,
        documentTypeName: DPNS_DOCUMENT_TYPE,
        where: [["records.identity", "in", uncachedIds]],
        orderBy: [["records.identity", "asc"]],
        limit: 100
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response?.documents) {
        documents = response.documents;
      } else if (response?.toJSON) {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      for (const doc of documents) {
        const data = doc.data || doc;
        const rawId = data.records?.identity || data.records?.dashUniqueIdentityId;
        const identityId = this.toBase58String(rawId);
        const label = data.label || data.normalizedLabel;
        const parentDomain = data.normalizedParentDomainName || "dash";
        const username = `${label}.${parentDomain}`;
        if (identityId && label) {
          results.set(identityId, username);
          this._cacheEntry(username, identityId);
        }
      }
    } catch (error) {
      console.error("DPNS: Batch resolution error:", error);
    }
    return results;
  }
  /**
   * Resolve a username for an identity ID (reverse lookup)
   * Returns the best username (contested usernames are preferred)
   */
  async resolveUsername(identityId) {
    try {
      const cached = this.reverseCache.get(identityId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`DPNS: Returning cached username for ${identityId}: ${cached.value}`);
        return cached.value;
      }
      console.log(`DPNS: Fetching username for identity: ${identityId}`);
      const allUsernames = await this.getAllUsernames(identityId);
      if (allUsernames.length === 0) {
        console.log(`DPNS: No username found for identity ${identityId}`);
        return null;
      }
      const sortedUsernames = await this.sortUsernamesByContested(allUsernames);
      const bestUsername = sortedUsernames[0];
      console.log(`DPNS: Found best username ${bestUsername} for identity ${identityId} (from ${allUsernames.length} total)`);
      this._cacheEntry(bestUsername, identityId);
      return bestUsername;
    } catch (error) {
      console.error("DPNS: Error resolving username:", error);
      return null;
    }
  }
  /**
   * Resolve an identity ID from a username
   */
  async resolveIdentity(username) {
    try {
      const normalizedUsername = username.toLowerCase().replace(/\.dash$/, "");
      const cached = this.cache.get(normalizedUsername);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
      }
      const sdk = await getEvoSdk();
      try {
        if (sdk.dpns?.resolveName) {
          const identityId = await sdk.dpns.resolveName(normalizedUsername);
          if (identityId) {
            this._cacheEntry(normalizedUsername, identityId);
            return identityId;
          }
        }
      } catch (error) {
        console.warn("DPNS: Native resolver failed, falling back to document query:", error);
      }
      const parts = normalizedUsername.split(".");
      const label = parts[0];
      const parentDomain = parts.slice(1).join(".") || "dash";
      const response = await sdk.documents.query({
        dataContractId: DPNS_CONTRACT_ID,
        documentTypeName: DPNS_DOCUMENT_TYPE,
        where: [
          ["normalizedLabel", "==", label.toLowerCase()],
          ["normalizedParentDomainName", "==", parentDomain.toLowerCase()]
        ],
        limit: 1
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response?.documents) {
        documents = response.documents;
      } else if (response?.toJSON) {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      if (documents.length > 0) {
        const doc = documents[0];
        const data = doc.data || doc;
        const rawId = data.records?.identity || data.records?.dashUniqueIdentityId || data.records?.dashAliasIdentityId;
        const identityId = this.toBase58String(rawId);
        if (identityId) {
          this._cacheEntry(normalizedUsername, identityId);
          return identityId;
        }
      }
      console.log(`DPNS: No identity found for username ${normalizedUsername}`);
      return null;
    } catch (error) {
      console.error("DPNS: Error resolving identity:", error);
      return null;
    }
  }
  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username) {
    try {
      const normalizedUsername = username.toLowerCase().replace(".dash", "");
      try {
        const sdk = await getEvoSdk();
        const isAvailable2 = await sdk.dpns.isNameAvailable(normalizedUsername);
        console.log(`DPNS: Username ${normalizedUsername} availability (native): ${isAvailable2}`);
        return isAvailable2;
      } catch (error) {
        console.warn("DPNS: Native availability check failed, trying identity resolution:", error);
      }
      const identity2 = await this.resolveIdentity(normalizedUsername);
      const isAvailable = identity2 === null;
      console.log(`DPNS: Username ${normalizedUsername} availability (fallback): ${isAvailable}`);
      return isAvailable;
    } catch (error) {
      console.error("DPNS: Error checking username availability:", error);
      return false;
    }
  }
  /**
   * Search for usernames by prefix with full details
   */
  async searchUsernamesWithDetails(prefix, limit = 10) {
    try {
      const sdk = await getEvoSdk();
      const searchPrefix = prefix.toLowerCase().replace(/\.dash$/, "");
      console.log(`DPNS: Searching usernames with prefix: ${searchPrefix}`);
      const where = [
        ["normalizedLabel", "startsWith", searchPrefix],
        ["normalizedParentDomainName", "==", "dash"]
      ];
      const orderBy = [["normalizedLabel", "asc"]];
      const response = await sdk.documents.query({
        dataContractId: DPNS_CONTRACT_ID,
        documentTypeName: DPNS_DOCUMENT_TYPE,
        where,
        orderBy,
        limit
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      }
      if (documents.length > 0) {
        console.log(`DPNS: Found ${documents.length} documents`);
        const results = documents.map((doc) => {
          const data = doc.data || doc;
          const label = data.label || data.normalizedLabel || "unknown";
          const parentDomain = data.normalizedParentDomainName || "dash";
          const ownerId = doc.ownerId || doc.$ownerId || "";
          return {
            username: `${label}.${parentDomain}`,
            ownerId
          };
        });
        return results;
      }
      return [];
    } catch (error) {
      console.error("DPNS: Error searching usernames with details:", error);
      return [];
    }
  }
  /**
   * Search for usernames by prefix
   */
  async searchUsernames(prefix, limit = 10) {
    try {
      const sdk = await getEvoSdk();
      const searchPrefix = prefix.toLowerCase().replace(/\.dash$/, "");
      console.log(`DPNS: Searching usernames with prefix: ${searchPrefix}`);
      console.log(`DPNS: Using contract ID: ${DPNS_CONTRACT_ID}`);
      console.log(`DPNS: Document type: ${DPNS_DOCUMENT_TYPE}`);
      const where = [
        ["normalizedLabel", "startsWith", searchPrefix],
        ["normalizedParentDomainName", "==", "dash"]
      ];
      const orderBy = [["normalizedLabel", "asc"]];
      console.log("DPNS: Query where clause:", JSON.stringify(where));
      console.log("DPNS: Query orderBy:", JSON.stringify(orderBy));
      const response = await sdk.documents.query({
        dataContractId: DPNS_CONTRACT_ID,
        documentTypeName: DPNS_DOCUMENT_TYPE,
        where,
        orderBy,
        limit
      });
      console.log("DPNS: Search response:", response);
      console.log("DPNS: Response type:", typeof response);
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      }
      if (documents.length > 0) {
        console.log(`DPNS: Found ${documents.length} documents`);
        const usernames = documents.map((doc) => {
          console.log("DPNS: Processing document:", doc);
          const data = doc.data || doc;
          const label = data.label || data.normalizedLabel || "unknown";
          const parentDomain = data.normalizedParentDomainName || "dash";
          console.log("DPNS: Document fields:", {
            label: data.label,
            normalizedLabel: data.normalizedLabel,
            parentDomain: data.normalizedParentDomainName,
            ownerId: doc.ownerId || doc.$ownerId
          });
          return `${label}.${parentDomain}`;
        });
        return usernames;
      }
      console.log("DPNS: No documents found in response");
      return [];
    } catch (error) {
      console.error("DPNS: Error searching usernames:", error);
      return [];
    }
  }
  /**
   * Register a new username
   */
  async registerUsername(label, identityId, publicKeyId, privateKeyWif, onPreorderSuccess) {
    try {
      const sdk = await getEvoSdk();
      const isValid2 = await sdk.dpns.isValidUsername(label);
      if (!isValid2) {
        throw new Error(`Invalid username format: ${label}`);
      }
      const isContested = await sdk.dpns.isContestedUsername(label);
      if (isContested) {
        console.warn(`Username ${label} is contested and will require masternode voting`);
      }
      const isAvailable = await sdk.dpns.isNameAvailable(label);
      if (!isAvailable) {
        throw new Error(`Username ${label} is already taken`);
      }
      console.log(`Registering DPNS name: ${label}`);
      const result = await sdk.dpns.registerName({
        label,
        identityId,
        publicKeyId,
        privateKeyWif,
        onPreorder: onPreorderSuccess
      });
      this.clearCache(void 0, identityId);
      return result;
    } catch (error) {
      console.error("Error registering username:", error);
      throw error;
    }
  }
  /**
   * Validate a username according to DPNS rules
   */
  async validateUsername(label) {
    const sdk = await getEvoSdk();
    const isValid2 = await sdk.dpns.isValidUsername(label);
    const isContested = await sdk.dpns.isContestedUsername(label);
    const normalizedLabel = await sdk.dpns.convertToHomographSafe(label);
    return {
      isValid: isValid2,
      isContested,
      normalizedLabel
    };
  }
  /**
   * Get username validation error message (basic client-side validation)
   * For full DPNS validation, use validateUsername() which requires SDK
   */
  getUsernameValidationError(username) {
    if (!username) {
      return "Username is required";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (username.length > 20) {
      return "Username must be 20 characters or less";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    if (username.startsWith("_") || username.endsWith("_")) {
      return "Username cannot start or end with underscore";
    }
    if (username.includes("__")) {
      return "Username cannot contain consecutive underscores";
    }
    return null;
  }
  /**
   * Clear cache entries
   */
  clearCache(username, identityId) {
    if (username) {
      this.cache.delete(username.toLowerCase());
    }
    if (identityId) {
      this.reverseCache.delete(identityId);
    }
    if (!username && !identityId) {
      this.cache.clear();
      this.reverseCache.clear();
    }
  }
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
    for (const [key, value] of Array.from(this.reverseCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.reverseCache.delete(key);
      }
    }
  }
};
var dpnsService = new DpnsService();
if (typeof window !== "undefined") {
  setInterval(() => {
    dpnsService.cleanupCache();
  }, 36e5);
}

// ../lib/services/identity-service.ts
init_evo_sdk_service();
var IdentityService = class {
  constructor() {
    this.identityCache = /* @__PURE__ */ new Map();
    this.balanceCache = /* @__PURE__ */ new Map();
    this.CACHE_TTL = 6e4;
  }
  // 1 minute cache
  /**
   * Fetch identity information
   */
  async getIdentity(identityId) {
    try {
      const cached = this.identityCache.get(identityId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      const sdk = await getEvoSdk();
      console.log(`Fetching identity: ${identityId}`);
      const identityResponse = await sdk.identities.fetch(identityId);
      if (!identityResponse) {
        console.warn(`Identity not found: ${identityId}`);
        return null;
      }
      const identity2 = identityResponse.toJSON();
      console.log("Raw identity response:", JSON.stringify(identity2, null, 2));
      console.log("Public keys from identity:", identity2.publicKeys);
      const identityInfo = {
        id: identity2.id || identityId,
        balance: identity2.balance || 0,
        publicKeys: identity2.publicKeys || identity2.public_keys || [],
        revision: identity2.revision || 0
      };
      this.identityCache.set(identityId, {
        data: identityInfo,
        timestamp: Date.now()
      });
      return identityInfo;
    } catch (error) {
      console.error("Error fetching identity:", error);
      throw error;
    }
  }
  /**
   * Get identity balance
   */
  async getBalance(identityId) {
    try {
      const cached = this.balanceCache.get(identityId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      const sdk = await getEvoSdk();
      console.log(`Fetching balance for: ${identityId}`);
      const balanceResponse = await sdk.identities.balance(identityId);
      const confirmedBalance = balanceResponse ? Number(balanceResponse) : 0;
      console.log(`Balance for ${identityId}: ${confirmedBalance} credits`);
      const balanceInfo = {
        confirmed: confirmedBalance,
        total: confirmedBalance
      };
      this.balanceCache.set(identityId, {
        data: balanceInfo,
        timestamp: Date.now()
      });
      return balanceInfo;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return { confirmed: 0, total: 0 };
    }
  }
  /**
   * Verify if identity exists
   */
  async verifyIdentity(identityId) {
    try {
      const identity2 = await this.getIdentity(identityId);
      return identity2 !== null;
    } catch (error) {
      console.error("Error verifying identity:", error);
      return false;
    }
  }
  /**
   * Get identity public keys
   */
  async getPublicKeys(identityId) {
    try {
      const identity2 = await this.getIdentity(identityId);
      return identity2?.publicKeys || [];
    } catch (error) {
      console.error("Error fetching public keys:", error);
      return [];
    }
  }
  /**
   * Clear cache for an identity
   */
  clearCache(identityId) {
    if (identityId) {
      this.identityCache.delete(identityId);
      this.balanceCache.delete(identityId);
    } else {
      this.identityCache.clear();
      this.balanceCache.clear();
    }
  }
  /**
   * Clear expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of Array.from(this.identityCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.identityCache.delete(key);
      }
    }
    for (const [key, value] of Array.from(this.balanceCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.balanceCache.delete(key);
      }
    }
  }
};
var identityService = new IdentityService();
if (typeof window !== "undefined") {
  setInterval(() => {
    identityService.cleanupCache();
  }, 6e4);
}

// src/services/cli-identity.ts
var CONFIG_DIR = path.join(os.homedir(), ".yappr");
var IDENTITY_FILE = path.join(CONFIG_DIR, "identity.json");
var CliIdentityService = class {
  identity = null;
  loaded = false;
  /**
   * Load identity from disk
   */
  loadFromDisk() {
    if (this.loaded)
      return this.identity;
    try {
      if (fs.existsSync(IDENTITY_FILE)) {
        const data = fs.readFileSync(IDENTITY_FILE, "utf-8");
        this.identity = JSON.parse(data);
        this.loaded = true;
        return this.identity;
      }
    } catch (e) {
    }
    this.loaded = true;
    return null;
  }
  /**
   * Get current identity (loads from disk if not loaded)
   */
  getIdentity() {
    if (!this.loaded) {
      return this.loadFromDisk();
    }
    return this.identity;
  }
  /**
   * Get identity ID or null
   */
  getIdentityId() {
    return this.getIdentity()?.identityId ?? null;
  }
  /**
   * Check if identity is set
   */
  hasIdentity() {
    return this.getIdentityId() !== null;
  }
  /**
   * Set identity by ID - validates on network and resolves username
   */
  async setIdentity(identityId) {
    const identityInfo = await identityService.getIdentity(identityId);
    if (!identityInfo) {
      throw new Error(`Identity not found: ${identityId}`);
    }
    const username = await dpnsService.resolveUsername(identityId);
    const identity2 = {
      identityId,
      username: username ?? void 0,
      balance: identityInfo.balance
    };
    this.saveToDisk(identity2);
    this.identity = identity2;
    return identity2;
  }
  /**
   * Clear identity
   */
  clearIdentity() {
    this.identity = null;
    try {
      if (fs.existsSync(IDENTITY_FILE)) {
        fs.unlinkSync(IDENTITY_FILE);
      }
    } catch (e) {
    }
  }
  /**
   * Refresh identity info (username, balance)
   */
  async refreshIdentity() {
    if (!this.identity)
      return null;
    const identityInfo = await identityService.getIdentity(this.identity.identityId);
    const username = await dpnsService.resolveUsername(this.identity.identityId);
    this.identity = {
      ...this.identity,
      username: username ?? void 0,
      balance: identityInfo?.balance
    };
    this.saveToDisk(this.identity);
    return this.identity;
  }
  saveToDisk(identity2) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity2, null, 2), { mode: 384 });
    } catch (e) {
    }
  }
};
var cliIdentityService = new CliIdentityService();

// src/store/identity.ts
var useIdentity = create((set, get) => ({
  identity: null,
  loading: false,
  error: null,
  loadIdentity: () => {
    const identity2 = cliIdentityService.loadFromDisk();
    set({ identity: identity2, loading: false, error: null });
  },
  setIdentity: async (identityId) => {
    set({ loading: true, error: null });
    try {
      const identity2 = await cliIdentityService.setIdentity(identityId);
      set({ identity: identity2, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to set identity",
        loading: false
      });
      throw e;
    }
  },
  clearIdentity: () => {
    cliIdentityService.clearIdentity();
    set({ identity: null, error: null });
  },
  refreshIdentity: async () => {
    const { identity: identity2 } = get();
    if (!identity2)
      return;
    set({ loading: true });
    try {
      const refreshed = await cliIdentityService.refreshIdentity();
      set({ identity: refreshed, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  }
}));

// src/screens/Timeline.tsx
import { useInput as useInput2 } from "ink";

// src/components/layout/Header.tsx
import { Box, Text } from "ink";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os2 from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os2.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => key in env)) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = /* @__PURE__ */ Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === void 0 ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/utils/colors.ts
var colors = {
  // Primary colors
  primary: source_default.cyan,
  secondary: source_default.gray,
  accent: source_default.magenta,
  // Text colors
  text: source_default.white,
  textMuted: source_default.gray,
  textDim: source_default.dim,
  // Status colors
  success: source_default.green,
  error: source_default.red,
  warning: source_default.yellow,
  info: source_default.blue,
  // UI elements
  border: source_default.gray,
  selected: source_default.bgCyan.black,
  highlight: source_default.bold,
  // Social
  username: source_default.cyan,
  displayName: source_default.bold.white,
  timestamp: source_default.gray,
  stats: source_default.gray,
  // Interactions
  liked: source_default.red,
  reposted: source_default.green,
  bookmarked: source_default.yellow
};
var styled = {
  username: (name) => colors.username(`@${name.replace(/^@/, "")}`),
  displayName: (name) => colors.displayName(name),
  timestamp: (time) => colors.timestamp(time),
  stat: (label, value) => colors.stats(`${value} ${label}`),
  // Post stats
  likes: (count, liked = false) => liked ? colors.liked(`\u2665 ${count}`) : colors.stats(`\u2661 ${count}`),
  reposts: (count, reposted = false) => reposted ? colors.reposted(`\u21BB ${count}`) : colors.stats(`\u21BB ${count}`),
  replies: (count) => colors.stats(`\u2192 ${count}`),
  // Selection
  selected: (text) => colors.selected(` ${text} `),
  // Headers
  header: (text) => colors.primary.bold(text),
  subheader: (text) => colors.secondary(text),
  // Keybinding hints
  key: (key) => source_default.bgGray.white(` ${key} `),
  hint: (key, action) => `${source_default.bgGray.white(` ${key} `)} ${source_default.gray(action)}`
};
var box = {
  topLeft: "\u250C",
  topRight: "\u2510",
  bottomLeft: "\u2514",
  bottomRight: "\u2518",
  horizontal: "\u2500",
  vertical: "\u2502",
  teeRight: "\u251C",
  teeLeft: "\u2524",
  teeDown: "\u252C",
  teeUp: "\u2534",
  cross: "\u253C"
};
function horizontalLine(width) {
  return colors.border(box.horizontal.repeat(width));
}

// src/utils/terminal.ts
function getTerminalSize() {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24
  };
}
function getContentHeight(headerLines = 2, footerLines = 2) {
  const { height } = getTerminalSize();
  return Math.max(1, height - headerLines - footerLines);
}
function getContentWidth(padding = 2) {
  const { width } = getTerminalSize();
  return Math.max(20, width - padding * 2);
}

// src/components/layout/Header.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Header({ title, subtitle }) {
  const { stack } = useNavigation();
  const { identity: identity2 } = useIdentity();
  const { width } = getTerminalSize();
  const breadcrumb = stack.length > 0 ? "\u2190 Back (b)" : "";
  const identityText = identity2 ? styled.username(identity2.username || identity2.identityId.slice(0, 8)) : "";
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", width, children: [
    /* @__PURE__ */ jsxs(Box, { justifyContent: "space-between", paddingX: 1, children: [
      /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Text, { children: styled.header(title) }),
        subtitle && /* @__PURE__ */ jsxs(Text, { children: [
          " ",
          styled.subheader(subtitle)
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Box, { children: [
        breadcrumb && /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
          breadcrumb,
          "  "
        ] }),
        identityText && /* @__PURE__ */ jsx(Text, { children: identityText })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { children: horizontalLine(width) })
  ] });
}

// src/components/layout/Footer.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var defaultHints = [
  { key: "j/k", action: "navigate" },
  { key: "Enter", action: "select" },
  { key: "b", action: "back" },
  { key: "?", action: "help" },
  { key: "q", action: "quit" }
];
function Footer({ hints: hints8 = defaultHints }) {
  const { width } = getTerminalSize();
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width, children: [
    /* @__PURE__ */ jsx2(Text2, { children: horizontalLine(width) }),
    /* @__PURE__ */ jsx2(Box2, { paddingX: 1, gap: 2, children: hints8.map((hint, i) => /* @__PURE__ */ jsx2(Text2, { children: styled.hint(hint.key, hint.action) }, i)) })
  ] });
}

// src/components/layout/Screen.tsx
import { Box as Box3 } from "ink";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Screen({ title, subtitle, children, hints: hints8, hideFooter }) {
  const { width, height } = getTerminalSize();
  const contentHeight = getContentHeight(2, hideFooter ? 0 : 2);
  return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", width, height, children: [
    /* @__PURE__ */ jsx3(Header, { title, subtitle }),
    /* @__PURE__ */ jsx3(Box3, { flexDirection: "column", height: contentHeight, overflow: "hidden", children }),
    !hideFooter && /* @__PURE__ */ jsx3(Footer, { hints: hints8 })
  ] });
}

// src/components/layout/TabBar.tsx
import { Box as Box4, Text as Text3 } from "ink";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function TabBar({ tabs: tabs3, activeIndex }) {
  return /* @__PURE__ */ jsx4(Box4, { paddingX: 1, gap: 2, marginBottom: 1, children: tabs3.map((tab, index) => {
    const isActive = index === activeIndex;
    return /* @__PURE__ */ jsxs4(
      Text3,
      {
        bold: isActive,
        color: isActive ? "cyan" : void 0,
        dimColor: !isActive,
        children: [
          tab.key && /* @__PURE__ */ jsxs4(Text3, { dimColor: true, children: [
            "[",
            tab.key,
            "] "
          ] }),
          tab.label,
          isActive && " \u2022"
        ]
      },
      index
    );
  }) });
}

// src/components/post/PostCard.tsx
import { Box as Box5, Text as Text4 } from "ink";

// node_modules/date-fns/toDate.mjs
function toDate(argument) {
  const argStr = Object.prototype.toString.call(argument);
  if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
    return new argument.constructor(+argument);
  } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
    return new Date(argument);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}

// node_modules/date-fns/constructFrom.mjs
function constructFrom(date, value) {
  if (date instanceof Date) {
    return new date.constructor(value);
  } else {
    return new Date(value);
  }
}

// node_modules/date-fns/constants.mjs
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var minutesInMonth = 43200;
var minutesInDay = 1440;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;

// node_modules/date-fns/_lib/defaultOptions.mjs
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// node_modules/date-fns/startOfWeek.mjs
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/date-fns/startOfISOWeek.mjs
function startOfISOWeek(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

// node_modules/date-fns/getISOWeekYear.mjs
function getISOWeekYear(date) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/date-fns/startOfDay.mjs
function startOfDay(date) {
  const _date = toDate(date);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.mjs
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// node_modules/date-fns/differenceInCalendarDays.mjs
function differenceInCalendarDays(dateLeft, dateRight) {
  const startOfDayLeft = startOfDay(dateLeft);
  const startOfDayRight = startOfDay(dateRight);
  const timestampLeft = +startOfDayLeft - getTimezoneOffsetInMilliseconds(startOfDayLeft);
  const timestampRight = +startOfDayRight - getTimezoneOffsetInMilliseconds(startOfDayRight);
  return Math.round((timestampLeft - timestampRight) / millisecondsInDay);
}

// node_modules/date-fns/startOfISOWeekYear.mjs
function startOfISOWeekYear(date) {
  const year = getISOWeekYear(date);
  const fourthOfJanuary = constructFrom(date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// node_modules/date-fns/compareAsc.mjs
function compareAsc(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const diff = _dateLeft.getTime() - _dateRight.getTime();
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  } else {
    return diff;
  }
}

// node_modules/date-fns/constructNow.mjs
function constructNow(date) {
  return constructFrom(date, Date.now());
}

// node_modules/date-fns/isDate.mjs
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// node_modules/date-fns/isValid.mjs
function isValid(date) {
  if (!isDate(date) && typeof date !== "number") {
    return false;
  }
  const _date = toDate(date);
  return !isNaN(Number(_date));
}

// node_modules/date-fns/differenceInCalendarMonths.mjs
function differenceInCalendarMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const yearDiff = _dateLeft.getFullYear() - _dateRight.getFullYear();
  const monthDiff = _dateLeft.getMonth() - _dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

// node_modules/date-fns/_lib/getRoundingMethod.mjs
function getRoundingMethod(method) {
  return (number) => {
    const round = method ? Math[method] : Math.trunc;
    const result = round(number);
    return result === 0 ? 0 : result;
  };
}

// node_modules/date-fns/differenceInMilliseconds.mjs
function differenceInMilliseconds(dateLeft, dateRight) {
  return +toDate(dateLeft) - +toDate(dateRight);
}

// node_modules/date-fns/endOfDay.mjs
function endOfDay(date) {
  const _date = toDate(date);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// node_modules/date-fns/endOfMonth.mjs
function endOfMonth(date) {
  const _date = toDate(date);
  const month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}

// node_modules/date-fns/isLastDayOfMonth.mjs
function isLastDayOfMonth(date) {
  const _date = toDate(date);
  return +endOfDay(_date) === +endOfMonth(_date);
}

// node_modules/date-fns/differenceInMonths.mjs
function differenceInMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const sign = compareAsc(_dateLeft, _dateRight);
  const difference = Math.abs(
    differenceInCalendarMonths(_dateLeft, _dateRight)
  );
  let result;
  if (difference < 1) {
    result = 0;
  } else {
    if (_dateLeft.getMonth() === 1 && _dateLeft.getDate() > 27) {
      _dateLeft.setDate(30);
    }
    _dateLeft.setMonth(_dateLeft.getMonth() - sign * difference);
    let isLastMonthNotFull = compareAsc(_dateLeft, _dateRight) === -sign;
    if (isLastDayOfMonth(toDate(dateLeft)) && difference === 1 && compareAsc(dateLeft, _dateRight) === 1) {
      isLastMonthNotFull = false;
    }
    result = sign * (difference - Number(isLastMonthNotFull));
  }
  return result === 0 ? 0 : result;
}

// node_modules/date-fns/differenceInSeconds.mjs
function differenceInSeconds(dateLeft, dateRight, options) {
  const diff = differenceInMilliseconds(dateLeft, dateRight) / 1e3;
  return getRoundingMethod(options?.roundingMethod)(diff);
}

// node_modules/date-fns/startOfYear.mjs
function startOfYear(date) {
  const cleanDate = toDate(date);
  const _date = constructFrom(date, 0);
  _date.setFullYear(cleanDate.getFullYear(), 0, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/date-fns/locale/en-US/_lib/formatDistance.mjs
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// node_modules/date-fns/locale/_lib/buildFormatLongFn.mjs
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}

// node_modules/date-fns/locale/en-US/_lib/formatLong.mjs
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// node_modules/date-fns/locale/en-US/_lib/formatRelative.mjs
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// node_modules/date-fns/locale/_lib/buildLocalizeFn.mjs
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// node_modules/date-fns/locale/en-US/_lib/localize.mjs
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// node_modules/date-fns/locale/_lib/buildMatchFn.mjs
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// node_modules/date-fns/locale/_lib/buildMatchPatternFn.mjs
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult)
      return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult)
      return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// node_modules/date-fns/locale/en-US/_lib/match.mjs
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// node_modules/date-fns/locale/en-US.mjs
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// node_modules/date-fns/getDayOfYear.mjs
function getDayOfYear(date) {
  const _date = toDate(date);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// node_modules/date-fns/getISOWeek.mjs
function getISOWeek(date) {
  const _date = toDate(date);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/date-fns/getWeekYear.mjs
function getWeekYear(date, options) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/date-fns/startOfWeekYear.mjs
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// node_modules/date-fns/getWeek.mjs
function getWeek(date, options) {
  const _date = toDate(date);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/date-fns/_lib/addLeadingZeros.mjs
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// node_modules/date-fns/_lib/format/lightFormatters.mjs
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// node_modules/date-fns/_lib/format/formatters.mjs
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "Q":
        return String(quarter);
      case "QQ":
        return addLeadingZeros(quarter, 2);
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "q":
        return String(quarter);
      case "qq":
        return addLeadingZeros(quarter, 2);
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "L":
        return String(month + 1);
      case "LL":
        return addLeadingZeros(month + 1, 2);
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "e":
        return String(localDayOfWeek);
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "c":
        return String(localDayOfWeek);
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      case "i":
        return String(isoDayOfWeek);
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0)
        hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0)
      hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      case "XXXXX":
      case "XXX":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      case "xxxxx":
      case "xxx":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(date.getTime() / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    const timestamp = date.getTime();
    return addLeadingZeros(timestamp, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// node_modules/date-fns/_lib/format/longFormatters.mjs
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// node_modules/date-fns/_lib/protectedTokens.mjs
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token))
    throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// node_modules/date-fns/format.mjs
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken)
      return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// node_modules/date-fns/formatDistance.mjs
function formatDistance2(date, baseDate, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const minutesInAlmostTwoDays = 2520;
  const comparison = compareAsc(date, baseDate);
  if (isNaN(comparison)) {
    throw new RangeError("Invalid time value");
  }
  const localizeOptions = Object.assign({}, options, {
    addSuffix: options?.addSuffix,
    comparison
  });
  let dateLeft;
  let dateRight;
  if (comparison > 0) {
    dateLeft = toDate(baseDate);
    dateRight = toDate(date);
  } else {
    dateLeft = toDate(date);
    dateRight = toDate(baseDate);
  }
  const seconds = differenceInSeconds(dateRight, dateLeft);
  const offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1e3;
  const minutes = Math.round((seconds - offsetInSeconds) / 60);
  let months;
  if (minutes < 2) {
    if (options?.includeSeconds) {
      if (seconds < 5) {
        return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);
      } else if (seconds < 10) {
        return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);
      } else if (seconds < 20) {
        return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);
      } else if (seconds < 40) {
        return locale.formatDistance("halfAMinute", 0, localizeOptions);
      } else if (seconds < 60) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", 1, localizeOptions);
      }
    } else {
      if (minutes === 0) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", minutes, localizeOptions);
      }
    }
  } else if (minutes < 45) {
    return locale.formatDistance("xMinutes", minutes, localizeOptions);
  } else if (minutes < 90) {
    return locale.formatDistance("aboutXHours", 1, localizeOptions);
  } else if (minutes < minutesInDay) {
    const hours = Math.round(minutes / 60);
    return locale.formatDistance("aboutXHours", hours, localizeOptions);
  } else if (minutes < minutesInAlmostTwoDays) {
    return locale.formatDistance("xDays", 1, localizeOptions);
  } else if (minutes < minutesInMonth) {
    const days = Math.round(minutes / minutesInDay);
    return locale.formatDistance("xDays", days, localizeOptions);
  } else if (minutes < minutesInMonth * 2) {
    months = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("aboutXMonths", months, localizeOptions);
  }
  months = differenceInMonths(dateRight, dateLeft);
  if (months < 12) {
    const nearestMonth = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("xMonths", nearestMonth, localizeOptions);
  } else {
    const monthsSinceStartOfYear = months % 12;
    const years = Math.trunc(months / 12);
    if (monthsSinceStartOfYear < 3) {
      return locale.formatDistance("aboutXYears", years, localizeOptions);
    } else if (monthsSinceStartOfYear < 9) {
      return locale.formatDistance("overXYears", years, localizeOptions);
    } else {
      return locale.formatDistance("almostXYears", years + 1, localizeOptions);
    }
  }
}

// node_modules/date-fns/formatDistanceToNow.mjs
function formatDistanceToNow(date, options) {
  return formatDistance2(date, constructNow(date), options);
}

// src/utils/format.ts
function truncate(text, maxLength) {
  if (text.length <= maxLength)
    return text;
  return text.slice(0, maxLength - 1) + "\u2026";
}
function wrapText(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine)
        lines.push(currentLine);
      if (word.length > width) {
        let remaining = word;
        while (remaining.length > width) {
          lines.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine)
    lines.push(currentLine);
  return lines;
}
function relativeTime(date) {
  const d = typeof date === "number" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}
function shortRelativeTime(date) {
  const d = typeof date === "number" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  if (diffSec < 60)
    return "now";
  if (diffMin < 60)
    return `${diffMin}m`;
  if (diffHour < 24)
    return `${diffHour}h`;
  if (diffDay < 7)
    return `${diffDay}d`;
  if (diffWeek < 52)
    return `${diffWeek}w`;
  return format(d, "MMM d");
}
function formatNumber(num) {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
function formatCredits(credits) {
  const dash = credits / 1e11;
  if (dash >= 1) {
    return dash.toFixed(4) + " DASH";
  }
  return formatNumber(credits) + " credits";
}

// src/components/post/PostCard.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function PostCard({ post, selected, showReplyTo }) {
  const width = getContentWidth();
  const contentWidth = width - 4;
  const contentLines = wrapText(post.content, contentWidth);
  const displayContent = contentLines.slice(0, 3);
  const truncated = contentLines.length > 3;
  const stats = [
    styled.likes(post.likes, post.liked),
    styled.reposts(post.reposts, post.reposted),
    styled.replies(post.replies)
  ].join("  ");
  const author = post.author;
  const authorName = author.displayName || author.username || "Unknown";
  const authorUsername = author.username || author.id.slice(0, 8);
  const indicator = selected ? colors.primary("\u25B6 ") : "  ";
  return /* @__PURE__ */ jsxs5(
    Box5,
    {
      flexDirection: "column",
      paddingX: 1,
      paddingY: 0,
      borderStyle: selected ? "single" : void 0,
      borderColor: selected ? "cyan" : void 0,
      children: [
        showReplyTo && post.replyToId && /* @__PURE__ */ jsx5(Text4, { dimColor: true, children: "  \\u2514\\u2500 replying to post" }),
        post.repostedBy && /* @__PURE__ */ jsxs5(Text4, { dimColor: true, children: [
          "  \\u21bb Reposted by ",
          post.repostedBy.displayName || post.repostedBy.username
        ] }),
        /* @__PURE__ */ jsxs5(Box5, { children: [
          /* @__PURE__ */ jsx5(Text4, { children: indicator }),
          /* @__PURE__ */ jsxs5(Text4, { children: [
            styled.displayName(truncate(authorName, 20)),
            " "
          ] }),
          /* @__PURE__ */ jsxs5(Text4, { children: [
            styled.username(authorUsername),
            " "
          ] }),
          /* @__PURE__ */ jsx5(Text4, { children: styled.timestamp("\xB7 " + shortRelativeTime(post.createdAt)) })
        ] }),
        /* @__PURE__ */ jsxs5(Box5, { flexDirection: "column", marginLeft: 2, children: [
          displayContent.map((line, i) => /* @__PURE__ */ jsx5(Text4, { children: line }, i)),
          truncated && /* @__PURE__ */ jsx5(Text4, { dimColor: true, children: "..." })
        ] }),
        post.media && post.media.length > 0 && /* @__PURE__ */ jsx5(Box5, { marginLeft: 2, children: /* @__PURE__ */ jsxs5(Text4, { dimColor: true, children: [
          "[",
          post.media[0].type,
          "]"
        ] }) }),
        post.quotedPostId && /* @__PURE__ */ jsx5(Box5, { marginLeft: 2, children: /* @__PURE__ */ jsx5(Text4, { dimColor: true, children: "\\u250c Quote \\u2510" }) }),
        /* @__PURE__ */ jsxs5(Box5, { marginLeft: 2, children: [
          /* @__PURE__ */ jsx5(Text4, { children: stats }),
          post.bookmarked && /* @__PURE__ */ jsx5(Text4, { color: "yellow", children: "  \\u2605" })
        ] }),
        /* @__PURE__ */ jsx5(Text4, { children: " " })
      ]
    }
  );
}

// src/components/post/PostFull.tsx
import { Box as Box6, Text as Text5 } from "ink";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function PostFull({ post }) {
  const width = getContentWidth();
  const contentWidth = width - 2;
  const contentLines = wrapText(post.content, contentWidth);
  const author = post.author;
  const authorName = author.displayName || author.username || "Unknown";
  const authorUsername = author.username || author.id.slice(0, 8);
  return /* @__PURE__ */ jsxs6(Box6, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsx6(Box6, { marginBottom: 1, children: /* @__PURE__ */ jsx6(Text5, { children: styled.displayName(authorName) }) }),
    /* @__PURE__ */ jsx6(Box6, { marginBottom: 1, children: /* @__PURE__ */ jsx6(Text5, { children: styled.username(authorUsername) }) }),
    /* @__PURE__ */ jsx6(Box6, { flexDirection: "column", marginBottom: 1, children: contentLines.map((line, i) => /* @__PURE__ */ jsx6(Text5, { children: line }, i)) }),
    post.media && post.media.length > 0 && /* @__PURE__ */ jsx6(Box6, { marginBottom: 1, children: /* @__PURE__ */ jsxs6(Text5, { dimColor: true, children: [
      "[",
      post.media[0].type,
      ": ",
      post.media[0].url,
      "]"
    ] }) }),
    post.quotedPost && /* @__PURE__ */ jsxs6(
      Box6,
      {
        flexDirection: "column",
        borderStyle: "single",
        borderColor: "gray",
        paddingX: 1,
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxs6(Box6, { children: [
            /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: post.quotedPost.author.displayName || post.quotedPost.author.username }),
            /* @__PURE__ */ jsxs6(Text5, { dimColor: true, children: [
              " ",
              styled.username(post.quotedPost.author.username || "")
            ] })
          ] }),
          /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: post.quotedPost.content.slice(0, 100) })
        ]
      }
    ),
    /* @__PURE__ */ jsx6(Box6, { marginBottom: 1, children: /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: relativeTime(post.createdAt) }) }),
    /* @__PURE__ */ jsx6(Text5, { children: horizontalLine(width - 2) }),
    /* @__PURE__ */ jsxs6(Box6, { gap: 3, marginY: 1, children: [
      /* @__PURE__ */ jsxs6(Text5, { children: [
        /* @__PURE__ */ jsx6(Text5, { bold: true, children: formatNumber(post.likes) }),
        /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: " Likes" })
      ] }),
      /* @__PURE__ */ jsxs6(Text5, { children: [
        /* @__PURE__ */ jsx6(Text5, { bold: true, children: formatNumber(post.reposts) }),
        /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: " Reposts" })
      ] }),
      /* @__PURE__ */ jsxs6(Text5, { children: [
        /* @__PURE__ */ jsx6(Text5, { bold: true, children: formatNumber(post.replies) }),
        /* @__PURE__ */ jsx6(Text5, { dimColor: true, children: " Replies" })
      ] })
    ] }),
    /* @__PURE__ */ jsx6(Text5, { children: horizontalLine(width - 2) }),
    /* @__PURE__ */ jsxs6(Box6, { gap: 2, marginTop: 1, children: [
      post.liked && /* @__PURE__ */ jsx6(Text5, { color: "red", children: "\\u2665 Liked" }),
      post.reposted && /* @__PURE__ */ jsx6(Text5, { color: "green", children: "\\u21bb Reposted" }),
      post.bookmarked && /* @__PURE__ */ jsx6(Text5, { color: "yellow", children: "\\u2605 Bookmarked" })
    ] })
  ] });
}

// src/components/common/ScrollList.tsx
import { useEffect } from "react";
import { Box as Box7, useInput } from "ink";
import { jsx as jsx7 } from "react/jsx-runtime";
function ScrollList({
  items,
  renderItem,
  onSelect,
  onLoadMore,
  hasMore,
  height
}) {
  const { selectedIndex, setSelectedIndex, moveSelection } = useNavigation();
  const listHeight = height ?? getContentHeight(4, 2);
  const itemHeight = 4;
  const visibleItems = Math.floor(listHeight / itemHeight);
  const scrollOffset = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(visibleItems / 2), items.length - visibleItems)
  );
  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      moveSelection(-1, items.length - 1);
    } else if (key.downArrow || input === "j") {
      moveSelection(1, items.length - 1);
    } else if (key.return && items[selectedIndex]) {
      onSelect?.(items[selectedIndex], selectedIndex);
    }
  });
  useEffect(() => {
    if (hasMore && selectedIndex >= items.length - 3) {
      onLoadMore?.();
    }
  }, [selectedIndex, items.length, hasMore]);
  useEffect(() => {
    if (selectedIndex >= items.length && items.length > 0) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length]);
  const visibleRange = items.slice(scrollOffset, scrollOffset + visibleItems + 2);
  return /* @__PURE__ */ jsx7(Box7, { flexDirection: "column", overflow: "hidden", children: visibleRange.map((item, i) => {
    const actualIndex = scrollOffset + i;
    const isSelected = actualIndex === selectedIndex;
    return /* @__PURE__ */ jsx7(Box7, { children: renderItem(item, actualIndex, isSelected) }, actualIndex);
  }) });
}

// src/components/common/Empty.tsx
import { Box as Box8, Text as Text6 } from "ink";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
function Empty({ message: message2 = "Nothing here", hint }) {
  return /* @__PURE__ */ jsxs7(Box8, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [
    /* @__PURE__ */ jsx8(Text6, { dimColor: true, children: message2 }),
    hint && /* @__PURE__ */ jsx8(Text6, { dimColor: true, color: "gray", children: hint })
  ] });
}

// src/components/post/PostList.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
function PostList({
  posts,
  onSelect,
  onLoadMore,
  hasMore,
  height,
  showReplyTo
}) {
  if (posts.length === 0) {
    return /* @__PURE__ */ jsx9(Empty, { message: "No posts yet", hint: "Check back later for new content" });
  }
  return /* @__PURE__ */ jsx9(
    ScrollList,
    {
      items: posts,
      height,
      hasMore,
      onLoadMore,
      onSelect: (post) => onSelect?.(post),
      renderItem: (post, index, isSelected) => /* @__PURE__ */ jsx9(PostCard, { post, selected: isSelected, showReplyTo })
    }
  );
}

// src/components/common/Spinner.tsx
import { useState, useEffect as useEffect2 } from "react";
import { Box as Box9, Text as Text7 } from "ink";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function Spinner({ label = "Loading..." }) {
  const [frame, setFrame] = useState(0);
  useEffect2(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsxs8(Box9, { paddingX: 1, children: [
    /* @__PURE__ */ jsxs8(Text7, { color: "cyan", children: [
      frames[frame],
      " "
    ] }),
    /* @__PURE__ */ jsx10(Text7, { dimColor: true, children: label })
  ] });
}

// src/components/common/Error.tsx
import { Box as Box10, Text as Text8 } from "ink";
import { jsxs as jsxs9 } from "react/jsx-runtime";
function Error2({ message: message2, details }) {
  return /* @__PURE__ */ jsxs9(Box10, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsxs9(Text8, { color: "red", children: [
      "\u2717",
      " ",
      message2
    ] }),
    details && /* @__PURE__ */ jsxs9(Text8, { dimColor: true, children: [
      "  ",
      details
    ] })
  ] });
}

// src/hooks/useTimeline.ts
import { useState as useState2, useEffect as useEffect3, useCallback } from "react";

// ../lib/services/post-service.ts
init_document_service();

// ../lib/services/block-service.ts
init_document_service();
init_state_transition_service();
init_sdk_helpers();
init_evo_sdk_service();
init_constants();

// ../node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// ../node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// ../lib/bloom-filter.ts
init_esm2();
var FILTER_SIZE_BYTES = 5e3;
var FILTER_SIZE_BITS = FILTER_SIZE_BYTES * 8;
var NUM_HASH_FUNCTIONS = 10;
var BLOOM_FILTER_VERSION = 1;
var BloomFilter = class _BloomFilter {
  constructor(data, itemCount = 0) {
    if (data) {
      this.bits = new Uint8Array(FILTER_SIZE_BYTES);
      this.bits.set(data.slice(0, FILTER_SIZE_BYTES));
    } else {
      this.bits = new Uint8Array(FILTER_SIZE_BYTES);
    }
    this._itemCount = itemCount;
  }
  /**
   * Add an identifier to the bloom filter.
   * @param identifier - Base58 string or 32-byte Uint8Array
   */
  add(identifier) {
    const bytes = typeof identifier === "string" ? esm_default2.decode(identifier) : identifier;
    const positions = this.getHashPositions(bytes);
    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      this.bits[byteIndex] |= 1 << bitIndex;
    }
    this._itemCount++;
  }
  /**
   * Check if an identifier might be in the filter.
   * @param identifier - Base58 string or 32-byte Uint8Array
   * @returns true if the identifier might be in the set (possible false positive),
   *          false if definitely not in the set
   */
  mightContain(identifier) {
    const bytes = typeof identifier === "string" ? esm_default2.decode(identifier) : identifier;
    const positions = this.getHashPositions(bytes);
    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      if (!(this.bits[byteIndex] & 1 << bitIndex)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Get bit positions for an identifier using multiple hash functions.
   * Uses SHA-256 and extracts multiple positions from the hash output.
   */
  getHashPositions(data) {
    const positions = [];
    let hash = sha256(data);
    for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) {
      if (i > 0 && i % 8 === 0) {
        hash = sha256(hash);
      }
      const offset = i % 8 * 4;
      const value = hash[offset] << 24 >>> 0 | hash[offset + 1] << 16 | hash[offset + 2] << 8 | hash[offset + 3];
      positions.push(value % FILTER_SIZE_BITS);
    }
    return positions;
  }
  /**
   * Serialize the bloom filter to a Uint8Array for storage.
   */
  serialize() {
    return new Uint8Array(this.bits);
  }
  /**
   * Get the number of items that have been added to the filter.
   */
  get itemCount() {
    return this._itemCount;
  }
  /**
   * Estimate the current false positive rate based on items added.
   * Formula: (1 - e^(-k*n/m))^k
   * where k = hash functions, n = items, m = bits
   */
  estimateFalsePositiveRate() {
    const k = NUM_HASH_FUNCTIONS;
    const m = FILTER_SIZE_BITS;
    const n = this._itemCount;
    if (n === 0)
      return 0;
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }
  /**
   * Merge another bloom filter into this one (OR operation).
   * Used to combine filters from multiple followed users.
   */
  merge(other) {
    for (let i = 0; i < FILTER_SIZE_BYTES; i++) {
      this.bits[i] |= other.bits[i];
    }
    this._itemCount += other._itemCount;
  }
  /**
   * Create a new bloom filter that is the union of multiple filters.
   */
  static merge(filters) {
    const merged = new _BloomFilter();
    for (const filter of filters) {
      merged.merge(filter);
    }
    return merged;
  }
  /**
   * Check if the filter is empty (no bits set).
   */
  isEmpty() {
    return this.bits.every((byte) => byte === 0);
  }
  /**
   * Get the size of the serialized filter in bytes.
   */
  static get sizeBytes() {
    return FILTER_SIZE_BYTES;
  }
};
function bloomFilterToBase64(filter) {
  const bytes = filter.serialize();
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function bloomFilterFromBase64(base64, itemCount = 0) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new BloomFilter(bytes, itemCount);
}

// ../lib/caches/block-cache.ts
var CACHE_KEY_PREFIX = "yappr_block_cache_";
var CACHE_TTL = 5 * 60 * 1e3;
function getCacheKey(userId) {
  return `${CACHE_KEY_PREFIX}${userId}`;
}
function getEmptyCache() {
  return {
    ownBlocks: { blockedIds: [], timestamp: 0 },
    blockFollows: { followedUserIds: [], timestamp: 0 },
    mergedBloomFilter: null,
    confirmedBlocks: {}
  };
}
function loadBlockCache(userId) {
  if (typeof window === "undefined")
    return null;
  try {
    const key = getCacheKey(userId);
    const raw = sessionStorage.getItem(key);
    if (!raw)
      return null;
    const data = JSON.parse(raw);
    const now = Date.now();
    if (now - data.ownBlocks.timestamp > CACHE_TTL) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
function saveBlockCache(userId, data) {
  if (typeof window === "undefined")
    return;
  try {
    const key = getCacheKey(userId);
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
  }
}
function invalidateBlockCache(userId) {
  if (typeof window === "undefined")
    return;
  const key = getCacheKey(userId);
  sessionStorage.removeItem(key);
}
function addOwnBlock(userId, blockedId) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  if (!cache.ownBlocks.blockedIds.includes(blockedId)) {
    cache.ownBlocks.blockedIds.push(blockedId);
    cache.ownBlocks.timestamp = Date.now();
  }
  cache.confirmedBlocks[blockedId] = {
    isBlocked: true,
    blockedBy: userId,
    timestamp: Date.now()
  };
  saveBlockCache(userId, cache);
}
function removeOwnBlock(userId, blockedId) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  cache.ownBlocks.blockedIds = cache.ownBlocks.blockedIds.filter((id) => id !== blockedId);
  cache.ownBlocks.timestamp = Date.now();
  delete cache.confirmedBlocks[blockedId];
  saveBlockCache(userId, cache);
}
function setBlockFollows(userId, followedUserIds) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  cache.blockFollows = {
    followedUserIds,
    timestamp: Date.now()
  };
  saveBlockCache(userId, cache);
}
function setMergedBloomFilter(userId, filter, sourceUsers) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  cache.mergedBloomFilter = {
    data: bloomFilterToBase64(filter),
    itemCount: filter.itemCount,
    sourceUsers,
    timestamp: Date.now()
  };
  saveBlockCache(userId, cache);
}
function getMergedBloomFilter(userId) {
  const cache = loadBlockCache(userId);
  if (!cache?.mergedBloomFilter)
    return null;
  return bloomFilterFromBase64(
    cache.mergedBloomFilter.data,
    cache.mergedBloomFilter.itemCount
  );
}
function addConfirmedBlock(userId, targetId, blockedBy, isBlocked, message2) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  cache.confirmedBlocks[targetId] = {
    isBlocked,
    blockedBy,
    message: message2,
    timestamp: Date.now()
  };
  saveBlockCache(userId, cache);
}
function getConfirmedBlock(userId, targetId) {
  const cache = loadBlockCache(userId);
  return cache?.confirmedBlocks[targetId];
}
function addConfirmedBlocksBatch(userId, results) {
  const cache = loadBlockCache(userId) || getEmptyCache();
  const now = Date.now();
  results.forEach((result, targetId) => {
    cache.confirmedBlocks[targetId] = {
      isBlocked: result.isBlocked,
      blockedBy: result.blockedBy,
      message: result.message,
      timestamp: now
    };
  });
  saveBlockCache(userId, cache);
}
function isInOwnBlocks(userId, targetId) {
  const cache = loadBlockCache(userId);
  return cache?.ownBlocks.blockedIds.includes(targetId) ?? false;
}
function getBlockFollowsFromCache(userId) {
  const cache = loadBlockCache(userId);
  return cache?.blockFollows.followedUserIds ?? [];
}
function initializeBlockCache(userId, ownBlockedIds, followedUserIds, mergedFilter, filterSourceUsers) {
  const now = Date.now();
  const cache = {
    ownBlocks: {
      blockedIds: ownBlockedIds,
      timestamp: now
    },
    blockFollows: {
      followedUserIds,
      timestamp: now
    },
    mergedBloomFilter: mergedFilter ? {
      data: bloomFilterToBase64(mergedFilter),
      itemCount: mergedFilter.itemCount,
      sourceUsers: filterSourceUsers,
      timestamp: now
    } : null,
    confirmedBlocks: {}
  };
  for (const blockedId of ownBlockedIds) {
    cache.confirmedBlocks[blockedId] = {
      isBlocked: true,
      blockedBy: userId,
      timestamp: now
    };
  }
  saveBlockCache(userId, cache);
}

// ../lib/services/block-service.ts
init_esm2();
var MAX_BLOCK_FOLLOWS = 100;
var BlockService = class extends BaseDocumentService {
  constructor() {
    super(DOCUMENT_TYPES.BLOCK, YAPPR_BLOCK_CONTRACT_ID);
    // In-memory cache for quick lookups (supplements sessionStorage)
    this.blockCache = /* @__PURE__ */ new Map();
  }
  /**
   * Transform raw block document to typed object.
   * SDK v3: System fields ($id, $ownerId) are base58, byte array fields are base64.
   */
  transformDocument(doc) {
    const data = doc.data || doc;
    const rawBlockedId = data.blockedId;
    const blockedId = rawBlockedId ? identifierToBase58(rawBlockedId) : "";
    if (rawBlockedId && !blockedId) {
      console.error("BlockService: Invalid blockedId format:", rawBlockedId);
    }
    return {
      $id: doc.$id || doc.id,
      $ownerId: doc.$ownerId || doc.ownerId,
      $createdAt: doc.$createdAt || doc.createdAt,
      blockedId: blockedId || "",
      message: data.message
    };
  }
  // ============================================================
  // BLOCK MANAGEMENT
  // ============================================================
  /**
   * Block a user with optional message.
   */
  async blockUser(blockerId, targetUserId, message2) {
    try {
      if (blockerId === targetUserId) {
        return { success: false, error: "Cannot block yourself" };
      }
      const existing = await this.getBlock(targetUserId, blockerId);
      if (existing) {
        return { success: true };
      }
      const blockedIdBytes = Array.from(esm_default2.decode(targetUserId));
      const documentData = { blockedId: blockedIdBytes };
      if (message2 && message2.trim()) {
        documentData.message = message2.trim().slice(0, 280);
      }
      const result = await stateTransitionService.createDocument(
        this.contractId,
        this.documentType,
        blockerId,
        documentData
      );
      if (result.success) {
        let blockerCache = this.blockCache.get(blockerId);
        if (!blockerCache) {
          blockerCache = /* @__PURE__ */ new Map();
          this.blockCache.set(blockerId, blockerCache);
        }
        blockerCache.set(targetUserId, true);
        addOwnBlock(blockerId, targetUserId);
        await this.addToBloomFilter(blockerId, targetUserId);
      }
      return result;
    } catch (error) {
      console.error("Error blocking user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to block user"
      };
    }
  }
  /**
   * Unblock a user.
   */
  async unblockUser(blockerId, targetUserId) {
    try {
      const block = await this.getBlock(targetUserId, blockerId);
      if (!block) {
        const blockerCache = this.blockCache.get(blockerId);
        if (blockerCache)
          blockerCache.set(targetUserId, false);
        removeOwnBlock(blockerId, targetUserId);
        return { success: true };
      }
      const result = await stateTransitionService.deleteDocument(
        this.contractId,
        this.documentType,
        block.$id,
        blockerId
      );
      if (result.success) {
        const blockerCache = this.blockCache.get(blockerId);
        if (blockerCache)
          blockerCache.set(targetUserId, false);
        removeOwnBlock(blockerId, targetUserId);
      }
      return result;
    } catch (error) {
      console.error("Error unblocking user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unblock user"
      };
    }
  }
  /**
   * Get a specific block document.
   */
  async getBlock(targetUserId, blockerId) {
    try {
      const result = await this.query({
        where: [
          ["$ownerId", "==", blockerId],
          ["blockedId", "==", targetUserId]
        ],
        limit: 1
      });
      return result.documents[0] || null;
    } catch (error) {
      console.error("Error getting block:", error);
      return null;
    }
  }
  /**
   * Get all blocks by a user.
   */
  async getUserBlocks(userId, options = {}) {
    try {
      const result = await this.query({
        where: [["$ownerId", "==", userId]],
        limit: 100,
        ...options
      });
      return result.documents;
    } catch (error) {
      console.error("Error getting user blocks:", error);
      return [];
    }
  }
  // ============================================================
  // BLOOM FILTER MANAGEMENT
  // ============================================================
  /**
   * Get the bloom filter for a user.
   */
  async getBloomFilter(userId) {
    try {
      const sdk = await getEvoSdk();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: DOCUMENT_TYPES.BLOCK_FILTER,
        where: [["$ownerId", "==", userId]],
        limit: 1
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc2) => typeof doc2.toJSON === "function" ? doc2.toJSON() : doc2);
      } else if (Array.isArray(response)) {
        documents = response;
      }
      if (documents.length === 0)
        return null;
      const doc = documents[0];
      const data = doc.data || doc;
      const filterData = data.filterData;
      let bytes;
      if (filterData instanceof Uint8Array) {
        bytes = filterData;
      } else if (Array.isArray(filterData)) {
        bytes = new Uint8Array(filterData);
      } else if (typeof filterData === "string") {
        const binary = atob(filterData);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
      } else {
        console.error("Unknown filterData format:", typeof filterData);
        return null;
      }
      return {
        filter: new BloomFilter(bytes, data.itemCount || 0),
        documentId: doc.$id || doc.id,
        revision: doc.$revision || doc.revision || 0
      };
    } catch (error) {
      console.error("Error getting bloom filter:", error);
      return null;
    }
  }
  /**
   * Get bloom filters for multiple users in batch.
   */
  async getBloomFiltersBatch(userIds) {
    const result = /* @__PURE__ */ new Map();
    if (userIds.length === 0)
      return result;
    try {
      const sdk = await getEvoSdk();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: DOCUMENT_TYPES.BLOCK_FILTER,
        where: [["$ownerId", "in", userIds]],
        orderBy: [["$ownerId", "asc"]],
        limit: Math.min(userIds.length, 100)
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      }
      for (const doc of documents) {
        const data = doc.data || doc;
        const ownerId = doc.$ownerId || doc.ownerId;
        const filterData = data.filterData;
        let bytes;
        if (filterData instanceof Uint8Array) {
          bytes = filterData;
        } else if (Array.isArray(filterData)) {
          bytes = new Uint8Array(filterData);
        } else if (typeof filterData === "string") {
          const binary = atob(filterData);
          bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
        } else {
          continue;
        }
        result.set(ownerId, new BloomFilter(bytes, data.itemCount || 0));
      }
    } catch (error) {
      console.error("Error getting bloom filters batch:", error);
    }
    return result;
  }
  /**
   * Add a blocked user ID to the bloom filter.
   * Creates the filter document if it doesn't exist.
   */
  async addToBloomFilter(userId, blockedId) {
    try {
      const existing = await this.getBloomFilter(userId);
      if (existing) {
        existing.filter.add(blockedId);
        await stateTransitionService.updateDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FILTER,
          existing.documentId,
          userId,
          {
            filterData: Array.from(existing.filter.serialize()),
            itemCount: existing.filter.itemCount,
            version: BLOOM_FILTER_VERSION
          },
          existing.revision
        );
      } else {
        const filter = new BloomFilter();
        filter.add(blockedId);
        await stateTransitionService.createDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FILTER,
          userId,
          {
            filterData: Array.from(filter.serialize()),
            itemCount: filter.itemCount,
            version: BLOOM_FILTER_VERSION
          }
        );
      }
    } catch (error) {
      console.error("Error adding to bloom filter:", error);
    }
  }
  // ============================================================
  // BLOCK FOLLOW MANAGEMENT
  // ============================================================
  /**
   * Get the block follow document for a user.
   */
  async getBlockFollow(userId) {
    try {
      const sdk = await getEvoSdk();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: DOCUMENT_TYPES.BLOCK_FOLLOW,
        where: [["$ownerId", "==", userId]],
        limit: 1
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc2) => typeof doc2.toJSON === "function" ? doc2.toJSON() : doc2);
      } else if (Array.isArray(response)) {
        documents = response;
      }
      if (documents.length === 0)
        return null;
      const doc = documents[0];
      const data = doc.data || doc;
      const followedBlockers = data.followedBlockers;
      const followedUserIds = this.decodeUserIdArray(followedBlockers);
      return {
        $id: doc.$id || doc.id,
        $ownerId: doc.$ownerId || doc.ownerId,
        $revision: doc.$revision || doc.revision,
        followedUserIds
      };
    } catch (error) {
      console.error("Error getting block follow:", error);
      return null;
    }
  }
  /**
   * Decode a byte array into an array of base58 user IDs.
   * Each user ID is 32 bytes.
   */
  decodeUserIdArray(data) {
    let bytes;
    if (data instanceof Uint8Array) {
      bytes = data;
    } else if (Array.isArray(data)) {
      bytes = new Uint8Array(data);
    } else if (typeof data === "string") {
      const binary = atob(data);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    } else {
      return [];
    }
    const userIds = [];
    for (let i = 0; i + 32 <= bytes.length; i += 32) {
      const idBytes = bytes.slice(i, i + 32);
      userIds.push(esm_default2.encode(idBytes));
    }
    return userIds;
  }
  /**
   * Encode an array of base58 user IDs into a byte array.
   */
  encodeUserIdArray(userIds) {
    const result = [];
    for (const userId of userIds) {
      const bytes = esm_default2.decode(userId);
      result.push(...Array.from(bytes));
    }
    return result;
  }
  /**
   * Follow another user's block list.
   */
  async followUserBlocks(userId, targetUserId) {
    try {
      if (userId === targetUserId) {
        return { success: false, error: "Cannot follow your own blocks" };
      }
      const existing = await this.getBlockFollow(userId);
      if (existing) {
        if (existing.followedUserIds.includes(targetUserId)) {
          return { success: true };
        }
        if (existing.followedUserIds.length >= MAX_BLOCK_FOLLOWS) {
          return { success: false, error: `Maximum ${MAX_BLOCK_FOLLOWS} block follows reached` };
        }
        const newList = [...existing.followedUserIds, targetUserId];
        const result = await stateTransitionService.updateDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FOLLOW,
          existing.$id,
          userId,
          { followedBlockers: this.encodeUserIdArray(newList) },
          existing.$revision || 0
        );
        if (result.success) {
          setBlockFollows(userId, newList);
          invalidateBlockCache(userId);
        }
        return result;
      } else {
        const result = await stateTransitionService.createDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FOLLOW,
          userId,
          { followedBlockers: this.encodeUserIdArray([targetUserId]) }
        );
        if (result.success) {
          setBlockFollows(userId, [targetUserId]);
          invalidateBlockCache(userId);
        }
        return result;
      }
    } catch (error) {
      console.error("Error following user blocks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to follow blocks"
      };
    }
  }
  /**
   * Unfollow a user's block list.
   */
  async unfollowUserBlocks(userId, targetUserId) {
    try {
      const existing = await this.getBlockFollow(userId);
      if (!existing) {
        return { success: true };
      }
      const newList = existing.followedUserIds.filter((id) => id !== targetUserId);
      if (newList.length === existing.followedUserIds.length) {
        return { success: true };
      }
      if (newList.length === 0) {
        const result = await stateTransitionService.deleteDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FOLLOW,
          existing.$id,
          userId
        );
        if (result.success) {
          setBlockFollows(userId, []);
          invalidateBlockCache(userId);
        }
        return result;
      } else {
        const result = await stateTransitionService.updateDocument(
          this.contractId,
          DOCUMENT_TYPES.BLOCK_FOLLOW,
          existing.$id,
          userId,
          { followedBlockers: this.encodeUserIdArray(newList) },
          existing.$revision || 0
        );
        if (result.success) {
          setBlockFollows(userId, newList);
          invalidateBlockCache(userId);
        }
        return result;
      }
    } catch (error) {
      console.error("Error unfollowing user blocks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unfollow blocks"
      };
    }
  }
  /**
   * Get list of users whose blocks are being followed.
   */
  async getBlockFollows(userId) {
    const cached = getBlockFollowsFromCache(userId);
    if (cached.length > 0) {
      return cached;
    }
    const data = await this.getBlockFollow(userId);
    if (data) {
      setBlockFollows(userId, data.followedUserIds);
      return data.followedUserIds;
    }
    return [];
  }
  // ============================================================
  // UNIFIED BLOCK CHECKING
  // ============================================================
  /**
   * Check if a target user is blocked by the viewer (own blocks + inherited blocks).
   */
  async isBlocked(targetUserId, viewerId) {
    if (!viewerId || !targetUserId)
      return false;
    if (isInOwnBlocks(viewerId, targetUserId)) {
      return true;
    }
    const confirmed = getConfirmedBlock(viewerId, targetUserId);
    if (confirmed !== void 0) {
      return confirmed.isBlocked;
    }
    const blockerCache = this.blockCache.get(viewerId);
    if (blockerCache?.has(targetUserId)) {
      return blockerCache.get(targetUserId);
    }
    const mergedFilter = getMergedBloomFilter(viewerId);
    if (mergedFilter && !mergedFilter.mightContain(targetUserId)) {
      return false;
    }
    const ownBlock = await this.getBlock(targetUserId, viewerId);
    if (ownBlock) {
      addConfirmedBlock(viewerId, targetUserId, viewerId, true, ownBlock.message);
      return true;
    }
    const followedBlockers = await this.getBlockFollows(viewerId);
    if (followedBlockers.length > 0) {
      const inheritedBlock = await this.checkInheritedBlocks(targetUserId, followedBlockers);
      if (inheritedBlock) {
        addConfirmedBlock(viewerId, targetUserId, inheritedBlock.blockedBy, true, inheritedBlock.message);
        return true;
      }
    }
    addConfirmedBlock(viewerId, targetUserId, "", false);
    return false;
  }
  /**
   * Check if target is blocked by any of the followed blockers.
   * Note: Must query each blocker individually since the index only supports
   * queries on ($ownerId, blockedId) with equality on both.
   */
  async checkInheritedBlocks(targetUserId, followedBlockers) {
    if (followedBlockers.length === 0)
      return null;
    try {
      const queries = followedBlockers.map(async (blockerId) => {
        try {
          const block = await this.getBlock(targetUserId, blockerId);
          if (block) {
            return {
              blockedBy: blockerId,
              message: block.message
            };
          }
        } catch (err) {
          console.error(`Error checking block from ${blockerId}:`, err);
        }
        return null;
      });
      const results = await Promise.all(queries);
      for (const result of results) {
        if (result)
          return result;
      }
    } catch (error) {
      console.error("Error checking inherited blocks:", error);
    }
    return null;
  }
  /**
   * Batch check if any targets are blocked (own + inherited).
   */
  async checkBlockedBatch(viewerId, targetIds) {
    const result = /* @__PURE__ */ new Map();
    if (!viewerId || targetIds.length === 0) {
      return result;
    }
    const uniqueTargetIds = Array.from(new Set(targetIds));
    const unchecked = [];
    for (const targetId of uniqueTargetIds) {
      if (isInOwnBlocks(viewerId, targetId)) {
        result.set(targetId, true);
        continue;
      }
      const confirmed = getConfirmedBlock(viewerId, targetId);
      if (confirmed !== void 0) {
        result.set(targetId, confirmed.isBlocked);
        continue;
      }
      const blockerCache = this.blockCache.get(viewerId);
      if (blockerCache?.has(targetId)) {
        result.set(targetId, blockerCache.get(targetId));
        continue;
      }
      unchecked.push(targetId);
    }
    if (unchecked.length === 0) {
      return result;
    }
    const mergedFilter = getMergedBloomFilter(viewerId);
    const possiblePositives = [];
    const definiteNegatives = [];
    for (const targetId of unchecked) {
      if (mergedFilter && !mergedFilter.mightContain(targetId)) {
        definiteNegatives.push(targetId);
        result.set(targetId, false);
      } else {
        possiblePositives.push(targetId);
      }
    }
    if (definiteNegatives.length > 0) {
      const batchResults = /* @__PURE__ */ new Map();
      for (const targetId of definiteNegatives) {
        batchResults.set(targetId, { blockedBy: "", isBlocked: false });
      }
      addConfirmedBlocksBatch(viewerId, batchResults);
    }
    if (possiblePositives.length === 0) {
      return result;
    }
    try {
      const ownBlocks = await this.queryBlockedIn(viewerId, possiblePositives);
      const ownBlockedSet = new Set(ownBlocks.map((b) => b.blockedId));
      const batchResults = /* @__PURE__ */ new Map();
      for (const targetId of possiblePositives) {
        if (ownBlockedSet.has(targetId)) {
          result.set(targetId, true);
          const block = ownBlocks.find((b) => b.blockedId === targetId);
          batchResults.set(targetId, { blockedBy: viewerId, isBlocked: true, message: block?.message });
        }
      }
      const stillUnchecked = possiblePositives.filter((id) => !ownBlockedSet.has(id));
      if (stillUnchecked.length > 0) {
        const followedBlockers = await this.getBlockFollows(viewerId);
        if (followedBlockers.length > 0) {
          const inheritedBlocks = await this.queryInheritedBlocksBatch(stillUnchecked, followedBlockers);
          for (const targetId of stillUnchecked) {
            const inherited = inheritedBlocks.get(targetId);
            if (inherited) {
              result.set(targetId, true);
              batchResults.set(targetId, { blockedBy: inherited.blockedBy, isBlocked: true, message: inherited.message });
            } else {
              result.set(targetId, false);
              batchResults.set(targetId, { blockedBy: "", isBlocked: false });
            }
          }
        } else {
          for (const targetId of stillUnchecked) {
            result.set(targetId, false);
            batchResults.set(targetId, { blockedBy: "", isBlocked: false });
          }
        }
      }
      addConfirmedBlocksBatch(viewerId, batchResults);
    } catch (error) {
      console.error("Error in batch block check:", error);
      for (const targetId of possiblePositives) {
        if (!result.has(targetId)) {
          result.set(targetId, false);
        }
      }
    }
    return result;
  }
  /**
   * Query blocks using 'in' operator for efficient batch lookup.
   */
  async queryBlockedIn(blockerId, targetIds) {
    if (targetIds.length === 0)
      return [];
    const sdk = await getEvoSdk();
    const response = await sdk.documents.query({
      dataContractId: this.contractId,
      documentTypeName: this.documentType,
      where: [
        ["$ownerId", "==", blockerId],
        ["blockedId", "in", targetIds]
      ],
      orderBy: [["blockedId", "asc"]],
      limit: Math.min(targetIds.length, 100)
    });
    let documents = [];
    if (response instanceof Map) {
      documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
    } else if (Array.isArray(response)) {
      documents = response;
    }
    return documents.map((doc) => this.transformDocument(doc));
  }
  /**
   * Query inherited blocks for multiple targets from multiple blockers.
   * Note: Dash Platform only supports one 'in' clause per query, so we
   * loop through blockers and query each with targetIds 'in' clause.
   */
  async queryInheritedBlocksBatch(targetIds, followedBlockers) {
    const result = /* @__PURE__ */ new Map();
    if (targetIds.length === 0 || followedBlockers.length === 0) {
      return result;
    }
    try {
      const sdk = await getEvoSdk();
      const queries = followedBlockers.map(async (blockerId) => {
        try {
          const response = await sdk.documents.query({
            dataContractId: this.contractId,
            documentTypeName: this.documentType,
            where: [
              ["$ownerId", "==", blockerId],
              ["blockedId", "in", targetIds]
            ],
            orderBy: [["blockedId", "asc"]],
            limit: Math.min(targetIds.length, 100)
          });
          let documents = [];
          if (response instanceof Map) {
            documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
          } else if (Array.isArray(response)) {
            documents = response;
          }
          return documents;
        } catch (err) {
          console.error(`Error querying blocks for blocker ${blockerId}:`, err);
          return [];
        }
      });
      const allResults = await Promise.all(queries);
      for (const documents of allResults) {
        for (const doc of documents) {
          const transformed = this.transformDocument(doc);
          if (!result.has(transformed.blockedId)) {
            result.set(transformed.blockedId, {
              blockedBy: transformed.$ownerId,
              message: transformed.message
            });
          }
        }
      }
    } catch (error) {
      console.error("Error querying inherited blocks batch:", error);
    }
    return result;
  }
  // ============================================================
  // INITIALIZATION
  // ============================================================
  /**
   * Initialize block data on page load.
   * Queries all necessary data and populates sessionStorage cache.
   */
  async initializeBlockData(userId) {
    const existingCache = loadBlockCache(userId);
    if (existingCache) {
      return;
    }
    try {
      const [blockFollowData, ownBlocks] = await Promise.all([
        this.getBlockFollow(userId),
        this.getUserBlocks(userId)
      ]);
      const followedUserIds = blockFollowData?.followedUserIds ?? [];
      const ownBlockedIds = ownBlocks.map((b) => b.blockedId);
      const filterUserIds = [userId, ...followedUserIds];
      const filters = await this.getBloomFiltersBatch(filterUserIds);
      const mergedFilter = filters.size > 0 ? BloomFilter.merge(Array.from(filters.values())) : null;
      initializeBlockCache(
        userId,
        ownBlockedIds,
        followedUserIds,
        mergedFilter,
        filterUserIds
      );
      if (mergedFilter) {
        setMergedBloomFilter(userId, mergedFilter, filterUserIds);
      }
    } catch (error) {
      console.error("Error initializing block data:", error);
    }
  }
  /**
   * Count blocked users.
   */
  async countUserBlocks(userId) {
    const blocks = await this.getUserBlocks(userId);
    return blocks.length;
  }
};
var blockService = new BlockService();

// ../lib/services/post-service.ts
init_follow_service();

// ../lib/services/unified-profile-service.ts
init_document_service();

// ../lib/cache-manager.ts
var CacheManager = class {
  constructor(defaultTtl = 3e5) {
    this.defaultTtl = defaultTtl;
    this.caches = /* @__PURE__ */ new Map();
    this.tagIndex = /* @__PURE__ */ new Map();
    this.startCleanup();
  }
  /**
   * Get or create a named cache
   */
  getCache(cacheName) {
    if (!this.caches.has(cacheName)) {
      this.caches.set(cacheName, /* @__PURE__ */ new Map());
    }
    return this.caches.get(cacheName);
  }
  /**
   * Set a cache entry
   */
  set(cacheName, key, data, options = {}) {
    const cache = this.getCache(cacheName);
    const { ttl = this.defaultTtl, tags = [] } = options;
    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    };
    cache.set(key, entry);
    const cacheKey = `${cacheName}:${key}`;
    tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, /* @__PURE__ */ new Set());
      }
      this.tagIndex.get(tag).add(cacheKey);
    });
  }
  /**
   * Get a cache entry
   */
  get(cacheName, key) {
    const cache = this.getCache(cacheName);
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(cacheName, key);
      return null;
    }
    return entry.data;
  }
  /**
   * Check if a cache entry exists and is valid
   */
  has(cacheName, key) {
    return this.get(cacheName, key) !== null;
  }
  /**
   * Delete a specific cache entry
   */
  delete(cacheName, key) {
    const cache = this.getCache(cacheName);
    const entry = cache.get(key);
    if (entry) {
      const cacheKey = `${cacheName}:${key}`;
      entry.tags?.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(cacheKey);
        if (this.tagIndex.get(tag)?.size === 0) {
          this.tagIndex.delete(tag);
        }
      });
    }
    return cache.delete(key);
  }
  /**
   * Clear all entries in a named cache
   */
  clear(cacheName) {
    const cache = this.getCache(cacheName);
    for (const [key, entry] of Array.from(cache.entries())) {
      const cacheKey = `${cacheName}:${key}`;
      entry.tags?.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(cacheKey);
        if (this.tagIndex.get(tag)?.size === 0) {
          this.tagIndex.delete(tag);
        }
      });
    }
    cache.clear();
  }
  /**
   * Invalidate all cache entries with specific tags
   */
  invalidateByTag(tag) {
    const entries = this.tagIndex.get(tag);
    if (!entries) {
      return 0;
    }
    let invalidated = 0;
    for (const cacheKey of Array.from(entries)) {
      const [cacheName, key] = cacheKey.split(":", 2);
      if (this.delete(cacheName, key)) {
        invalidated++;
      }
    }
    return invalidated;
  }
  /**
   * Invalidate multiple tags
   */
  invalidateByTags(tags) {
    let totalInvalidated = 0;
    tags.forEach((tag) => {
      totalInvalidated += this.invalidateByTag(tag);
    });
    return totalInvalidated;
  }
  /**
   * Get cache statistics
   */
  getStats(cacheName) {
    const cacheNames = cacheName ? [cacheName] : Array.from(this.caches.keys());
    let totalEntries = 0;
    const cacheDetails = {};
    cacheNames.forEach((name) => {
      const cache = this.caches.get(name);
      if (cache) {
        let expired = 0;
        const now = Date.now();
        for (const entry of Array.from(cache.values())) {
          if (now - entry.timestamp > entry.ttl) {
            expired++;
          }
        }
        cacheDetails[name] = {
          entries: cache.size,
          expired
        };
        totalEntries += cache.size;
      }
    });
    return {
      caches: Array.from(this.caches.keys()),
      totalEntries,
      totalTags: this.tagIndex.size,
      ...cacheName ? {} : { cacheDetails }
    };
  }
  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();
    for (const [cacheName, cache] of Array.from(this.caches.entries())) {
      const expiredKeys = [];
      for (const [key, entry] of Array.from(cache.entries())) {
        if (now - entry.timestamp > entry.ttl) {
          expiredKeys.push(key);
        }
      }
      expiredKeys.forEach((key) => {
        if (this.delete(cacheName, key)) {
          cleaned++;
        }
      });
    }
    console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    return cleaned;
  }
  /**
   * Start automatic cleanup
   */
  startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 6e4);
  }
  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = void 0;
    }
  }
  /**
   * Clear all caches
   */
  clearAll() {
    this.caches.clear();
    this.tagIndex.clear();
  }
};
var cacheManager = new CacheManager();
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cacheManager.stopCleanup();
  });
}

// ../lib/services/unified-profile-service.ts
init_constants();
var APPROVED_PAYMENT_SCHEMES = [
  "dash:",
  // Dash
  "bitcoin:",
  // Bitcoin
  "litecoin:",
  // Litecoin
  "ethereum:",
  // Ethereum
  "monero:",
  // Monero
  "dogecoin:",
  // Dogecoin
  "bitcoincash:",
  // Bitcoin Cash
  "zcash:",
  // Zcash
  "stellar:",
  // Stellar (XLM)
  "ripple:",
  // XRP
  "solana:",
  // Solana
  "cardano:",
  // Cardano (ADA)
  "polkadot:",
  // Polkadot (DOT)
  "tron:",
  // Tron (TRX)
  "lightning:"
  // Bitcoin Lightning Network
];
var DICEBEAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "rings",
  "shapes",
  "thumbs"
];
var DEFAULT_AVATAR_STYLE = "thumbs";
var UnifiedProfileService = class extends BaseDocumentService {
  constructor() {
    super("profile", YAPPR_PROFILE_CONTRACT_ID);
    this.PROFILE_CACHE = "unified_profiles";
    this.USERNAME_CACHE = "usernames";
    this.AVATAR_CACHE = "avatars";
    // DataLoader-style batching for avatar URLs
    this.pendingAvatarRequests = /* @__PURE__ */ new Map();
    this.batchTimeout = null;
  }
  // ==================== Avatar URL Helpers ====================
  /**
   * Generate DiceBear avatar URL from config
   */
  getAvatarUrlFromConfig(config) {
    if (!config.seed) {
      console.warn("UnifiedProfileService: getAvatarUrlFromConfig called with empty seed");
      return "";
    }
    return `https://api.dicebear.com/7.x/${config.style}/svg?seed=${encodeURIComponent(config.seed)}`;
  }
  /**
   * Get default avatar URL using user ID as seed
   */
  getDefaultAvatarUrl(userId) {
    if (!userId) {
      console.warn("UnifiedProfileService: getDefaultAvatarUrl called with empty userId");
      return "";
    }
    return this.getAvatarUrlFromConfig({ style: DEFAULT_AVATAR_STYLE, seed: userId });
  }
  /**
   * Parse avatar field - can be DiceBear JSON or direct URI
   */
  parseAvatarField(avatarField, userId) {
    if (!avatarField) {
      return this.getDefaultAvatarUrl(userId);
    }
    if (avatarField.startsWith("http://") || avatarField.startsWith("https://") || avatarField.startsWith("ipfs://")) {
      return avatarField;
    }
    try {
      const parsed = JSON.parse(avatarField);
      if (parsed.style && parsed.seed) {
        const style = DICEBEAR_STYLES.includes(parsed.style) ? parsed.style : DEFAULT_AVATAR_STYLE;
        return this.getAvatarUrlFromConfig({ style, seed: parsed.seed });
      }
    } catch {
    }
    return this.getAvatarUrlFromConfig({ style: DEFAULT_AVATAR_STYLE, seed: avatarField });
  }
  /**
   * Encode avatar config to JSON string for storage
   */
  encodeAvatarData(seed, style) {
    return JSON.stringify({ seed, style });
  }
  /**
   * Generate a random seed string
   */
  generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  // ==================== Batching for Avatar URLs ====================
  /**
   * Schedule batch processing with debounce
   */
  scheduleBatch() {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
    }
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processBatch();
    }, 5);
  }
  /**
   * Process all pending avatar requests in a single batch query
   */
  async processBatch() {
    const batch = new Map(this.pendingAvatarRequests);
    this.pendingAvatarRequests.clear();
    if (batch.size === 0)
      return;
    const userIds = Array.from(batch.keys());
    try {
      const results = await this.fetchAvatarUrlsBatch(userIds);
      Array.from(batch.entries()).forEach(([userId, { resolvers }]) => {
        const url = results.get(userId) || this.getDefaultAvatarUrl(userId);
        resolvers.forEach((resolve) => resolve(url));
      });
    } catch (error) {
      Array.from(batch.entries()).forEach(([userId, { resolvers }]) => {
        const url = this.getDefaultAvatarUrl(userId);
        resolvers.forEach((resolve) => resolve(url));
      });
    }
  }
  /**
   * Get avatar URL for a user with DataLoader-style batching
   */
  async getAvatarUrl(ownerId) {
    if (!ownerId) {
      console.warn("UnifiedProfileService: getAvatarUrl called with empty ownerId");
      return "";
    }
    const cached = cacheManager.get(this.AVATAR_CACHE, ownerId);
    if (cached) {
      return cached;
    }
    return new Promise((resolve) => {
      const existing = this.pendingAvatarRequests.get(ownerId);
      if (existing) {
        existing.resolvers.push(resolve);
      } else {
        this.pendingAvatarRequests.set(ownerId, { resolvers: [resolve] });
      }
      this.scheduleBatch();
    });
  }
  /**
   * Batch fetch avatar URLs for multiple users
   */
  async fetchAvatarUrlsBatch(userIds) {
    const result = /* @__PURE__ */ new Map();
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "profile",
        where: [["$ownerId", "in", userIds]],
        orderBy: [["$ownerId", "asc"]],
        limit: userIds.length
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      }
      const foundUserIds = /* @__PURE__ */ new Set();
      for (const doc of documents) {
        const profileDoc = this.extractDocumentData(doc);
        const avatarUrl = this.parseAvatarField(profileDoc.avatar, profileDoc.$ownerId);
        result.set(profileDoc.$ownerId, avatarUrl);
        foundUserIds.add(profileDoc.$ownerId);
        cacheManager.set(this.AVATAR_CACHE, profileDoc.$ownerId, avatarUrl, {
          ttl: 3e5,
          // 5 minutes
          tags: ["avatar", `user:${profileDoc.$ownerId}`]
        });
      }
      for (const userId of userIds) {
        if (!foundUserIds.has(userId)) {
          result.set(userId, this.getDefaultAvatarUrl(userId));
        }
      }
    } catch (error) {
      console.error("UnifiedProfileService: Error getting batch avatar URLs:", error);
      for (const userId of userIds) {
        if (!result.has(userId)) {
          result.set(userId, this.getDefaultAvatarUrl(userId));
        }
      }
    }
    return result;
  }
  // ==================== Payment URI Helpers ====================
  /**
   * Parse payment URIs from JSON string and filter to approved schemes
   */
  parsePaymentUris(paymentUrisJson) {
    if (!paymentUrisJson)
      return [];
    try {
      const uris = JSON.parse(paymentUrisJson);
      return uris.filter((uri) => this.isApprovedPaymentScheme(uri)).map((uri) => ({
        scheme: this.extractScheme(uri),
        uri
      }));
    } catch {
      return [];
    }
  }
  /**
   * Check if a URI has an approved payment scheme
   */
  isApprovedPaymentScheme(uri) {
    const lowerUri = uri.toLowerCase();
    return APPROVED_PAYMENT_SCHEMES.some((scheme) => lowerUri.startsWith(scheme));
  }
  /**
   * Extract scheme from URI
   */
  extractScheme(uri) {
    const colonIndex = uri.indexOf(":");
    if (colonIndex > 0) {
      return uri.substring(0, colonIndex + 1).toLowerCase();
    }
    return "";
  }
  /**
   * Encode payment URIs to JSON string for storage
   */
  encodePaymentUris(uris) {
    return JSON.stringify(uris);
  }
  // ==================== Social Links Helpers ====================
  /**
   * Parse social links from JSON string
   */
  parseSocialLinks(socialLinksJson) {
    if (!socialLinksJson)
      return [];
    try {
      return JSON.parse(socialLinksJson);
    } catch {
      return [];
    }
  }
  /**
   * Encode social links to JSON string for storage
   */
  encodeSocialLinks(links) {
    return JSON.stringify(links);
  }
  // ==================== Document Transformation ====================
  /**
   * Extract raw document data handling SDK response formats
   */
  extractDocumentData(doc) {
    const isNestedFormat = doc.data && typeof doc.data === "object" && !Array.isArray(doc.data);
    const content = isNestedFormat ? doc.data : doc;
    return {
      $id: doc.$id || doc.id,
      $ownerId: doc.$ownerId || doc.ownerId,
      $createdAt: doc.$createdAt || doc.createdAt,
      $updatedAt: doc.$updatedAt || doc.updatedAt,
      $revision: doc.$revision || doc.revision,
      displayName: content.displayName || "",
      bio: content.bio,
      location: content.location,
      website: content.website,
      bannerUri: content.bannerUri,
      avatar: content.avatar,
      paymentUris: content.paymentUris,
      pronouns: content.pronouns,
      nsfw: content.nsfw,
      socialLinks: content.socialLinks
    };
  }
  /**
   * Transform document to User type
   */
  transformDocument(doc, options) {
    const profileDoc = this.extractDocumentData(doc);
    const cachedUsername = options?.cachedUsername;
    const ownerIdStr = profileDoc.$ownerId || "unknown";
    const user = {
      id: ownerIdStr,
      documentId: profileDoc.$id,
      $revision: profileDoc.$revision,
      username: cachedUsername || ownerIdStr.substring(0, 8) + "...",
      displayName: profileDoc.displayName || cachedUsername || ownerIdStr.substring(0, 8) + "...",
      avatar: this.parseAvatarField(profileDoc.avatar, ownerIdStr),
      bio: profileDoc.bio,
      location: profileDoc.location,
      website: profileDoc.website,
      followers: 0,
      following: 0,
      verified: false,
      joinedAt: new Date(profileDoc.$createdAt),
      // New unified profile fields
      bannerUri: profileDoc.bannerUri,
      paymentUris: this.parsePaymentUris(profileDoc.paymentUris),
      pronouns: profileDoc.pronouns,
      nsfw: profileDoc.nsfw,
      socialLinks: this.parseSocialLinks(profileDoc.socialLinks),
      hasUnifiedProfile: true
    };
    this.enrichUser(user, !!cachedUsername);
    return user;
  }
  /**
   * Enrich user with async data (username, stats)
   */
  async enrichUser(user, skipUsernameResolution) {
    try {
      if (!skipUsernameResolution && user.username === user.id.substring(0, 8) + "...") {
        const username = await this.getUsername(user.id);
        if (username) {
          user.username = username;
        }
      }
      const stats = await this.getUserStats(user.id);
      user.followers = stats.followers;
      user.following = stats.following;
    } catch (error) {
      console.error("UnifiedProfileService: Error enriching user:", error);
    }
  }
  /**
   * Get username from DPNS
   */
  async getUsername(ownerId) {
    const cached = cacheManager.get(this.USERNAME_CACHE, ownerId);
    if (cached)
      return cached;
    try {
      const username = await dpnsService.resolveUsername(ownerId);
      if (username) {
        cacheManager.set(this.USERNAME_CACHE, ownerId, username, {
          ttl: 3e5,
          tags: ["username", `user:${ownerId}`]
        });
      }
      return username;
    } catch (error) {
      console.error("UnifiedProfileService: Error resolving username:", error);
      return null;
    }
  }
  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    return { followers: 0, following: 0 };
  }
  // ==================== Profile CRUD ====================
  /**
   * Get profile by owner ID
   */
  async getProfile(ownerId, cachedUsername) {
    try {
      const cached = cacheManager.get(this.PROFILE_CACHE, ownerId);
      if (cached) {
        if (cachedUsername && cached.username !== cachedUsername) {
          cached.username = cachedUsername;
        }
        return cached;
      }
      const result = await this.query({
        where: [["$ownerId", "==", ownerId]],
        limit: 1
      });
      if (result.documents.length > 0) {
        const profile = result.documents[0];
        if (cachedUsername) {
          profile.username = cachedUsername;
        }
        cacheManager.set(this.PROFILE_CACHE, ownerId, profile, {
          ttl: 3e5,
          tags: ["profile", `user:${ownerId}`]
        });
        return profile;
      }
      return null;
    } catch (error) {
      console.error("UnifiedProfileService: Error getting profile:", error);
      return null;
    }
  }
  /**
   * Get profile with username fully resolved
   */
  async getProfileWithUsername(ownerId) {
    try {
      const username = await this.getUsername(ownerId);
      const profile = await this.getProfile(ownerId, username || void 0);
      if (profile && username) {
        profile.username = username;
      }
      return profile;
    } catch (error) {
      console.error("UnifiedProfileService: Error getting profile with username:", error);
      return this.getProfile(ownerId);
    }
  }
  /**
   * Get payment URIs for a user (filtered to approved schemes)
   */
  async getPaymentUris(ownerId) {
    const profile = await this.getProfile(ownerId);
    return profile?.paymentUris || [];
  }
  /**
   * Create user profile
   */
  async createProfile(ownerId, data) {
    const documentData = {
      displayName: data.displayName
    };
    if (data.bio)
      documentData.bio = data.bio;
    if (data.location)
      documentData.location = data.location;
    if (data.website)
      documentData.website = data.website;
    if (data.bannerUri)
      documentData.bannerUri = data.bannerUri;
    if (data.avatar)
      documentData.avatar = data.avatar;
    if (data.paymentUris && data.paymentUris.length > 0) {
      documentData.paymentUris = this.encodePaymentUris(data.paymentUris);
    }
    if (data.pronouns)
      documentData.pronouns = data.pronouns;
    if (data.nsfw !== void 0)
      documentData.nsfw = data.nsfw;
    if (data.socialLinks && data.socialLinks.length > 0) {
      documentData.socialLinks = this.encodeSocialLinks(data.socialLinks);
    }
    const result = await this.create(ownerId, documentData);
    cacheManager.invalidateByTag(`user:${ownerId}`);
    return result;
  }
  /**
   * Update user profile
   * Note: We must include ALL fields in the update to preserve existing values,
   * as Dash Platform document updates replace the entire document.
   */
  async updateProfile(ownerId, updates) {
    try {
      cacheManager.invalidateByTag(`user:${ownerId}`);
      const rawProfile = await this.getRawProfile(ownerId);
      if (!rawProfile) {
        throw new Error("Profile not found");
      }
      const documentData = {
        // displayName is required
        displayName: updates.displayName !== void 0 ? updates.displayName.trim() : rawProfile.displayName
      };
      const bio = updates.bio !== void 0 ? updates.bio.trim() : rawProfile.bio;
      if (bio)
        documentData.bio = bio;
      const location = updates.location !== void 0 ? updates.location.trim() : rawProfile.location;
      if (location)
        documentData.location = location;
      const website = updates.website !== void 0 ? updates.website.trim() : rawProfile.website;
      if (website)
        documentData.website = website;
      const bannerUri = updates.bannerUri !== void 0 ? updates.bannerUri.trim() : rawProfile.bannerUri;
      if (bannerUri)
        documentData.bannerUri = bannerUri;
      const avatar = updates.avatar !== void 0 ? updates.avatar : rawProfile.avatar;
      if (avatar)
        documentData.avatar = avatar;
      if (updates.paymentUris !== void 0) {
        if (updates.paymentUris.length > 0) {
          documentData.paymentUris = this.encodePaymentUris(updates.paymentUris);
        }
      } else if (rawProfile.paymentUris) {
        documentData.paymentUris = rawProfile.paymentUris;
      }
      const pronouns = updates.pronouns !== void 0 ? updates.pronouns.trim() : rawProfile.pronouns;
      if (pronouns)
        documentData.pronouns = pronouns;
      if (updates.nsfw !== void 0) {
        documentData.nsfw = updates.nsfw;
      } else if (rawProfile.nsfw !== void 0) {
        documentData.nsfw = rawProfile.nsfw;
      }
      if (updates.socialLinks !== void 0) {
        if (updates.socialLinks.length > 0) {
          documentData.socialLinks = this.encodeSocialLinks(updates.socialLinks);
        }
      } else if (rawProfile.socialLinks) {
        documentData.socialLinks = rawProfile.socialLinks;
      }
      const docId = rawProfile.$id;
      if (!docId) {
        throw new Error("Profile document ID not found");
      }
      const result = await this.update(docId, ownerId, documentData);
      cacheManager.invalidateByTag(`user:${ownerId}`);
      return result;
    } catch (error) {
      console.error("UnifiedProfileService: Error updating profile:", error);
      throw error;
    }
  }
  /**
   * Get raw profile document (not transformed to User type)
   * Used internally to preserve field values during updates
   */
  async getRawProfile(ownerId) {
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "profile",
        where: [["$ownerId", "==", ownerId]],
        limit: 1
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      }
      if (documents.length === 0) {
        return null;
      }
      return this.extractDocumentData(documents[0]);
    } catch (error) {
      console.error("UnifiedProfileService: Error getting raw profile:", error);
      return null;
    }
  }
  /**
   * Get profiles by array of identity IDs (batch)
   */
  async getProfilesByIdentityIds(identityIds) {
    try {
      if (identityIds.length === 0)
        return [];
      const bs58 = (await Promise.resolve().then(() => (init_esm2(), esm_exports))).default;
      const validIds = identityIds.filter((id) => {
        if (!id || id === "unknown")
          return false;
        try {
          const decoded = bs58.decode(id);
          return decoded.length === 32;
        } catch {
          return false;
        }
      });
      if (validIds.length === 0)
        return [];
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: this.documentType,
        where: [["$ownerId", "in", validIds]],
        orderBy: [["$ownerId", "asc"]],
        limit: 100
      });
      if (response instanceof Map) {
        return Array.from(response.values()).filter(Boolean).map((doc) => this.extractDocumentData(
          typeof doc.toJSON === "function" ? doc.toJSON() : doc
        ));
      }
      const anyResponse = response;
      if (Array.isArray(anyResponse)) {
        return anyResponse.map((doc) => this.extractDocumentData(doc));
      } else if (anyResponse?.documents) {
        return anyResponse.documents.map((doc) => this.extractDocumentData(doc));
      }
      return [];
    } catch (error) {
      console.error("UnifiedProfileService: Error getting profiles by identity IDs:", error);
      return [];
    }
  }
  /**
   * Batch get avatar URLs for multiple users
   */
  async getAvatarUrlsBatch(userIds) {
    const result = /* @__PURE__ */ new Map();
    if (userIds.length === 0)
      return result;
    const promises = userIds.filter((id) => !!id).map(async (userId) => {
      const url = await this.getAvatarUrl(userId);
      result.set(userId, url);
    });
    await Promise.all(promises);
    return result;
  }
};
var unifiedProfileService = new UnifiedProfileService();

// ../lib/services/post-service.ts
init_sdk_helpers();

// ../lib/caches/user-status-cache.ts
var CACHE_TTL2 = 2 * 60 * 1e3;
var blockCache = /* @__PURE__ */ new Map();
function seedBlockStatusCache(blockerId, statusMap) {
  if (!blockerId)
    return;
  const now = Date.now();
  statusMap.forEach((isBlocked, targetUserId) => {
    const cacheKey = `${blockerId}:${targetUserId}`;
    blockCache.set(cacheKey, { isBlocked, timestamp: now });
  });
}
var followCache = /* @__PURE__ */ new Map();
function seedFollowStatusCache(followerId, statusMap) {
  if (!followerId)
    return;
  const now = Date.now();
  statusMap.forEach((isFollowing, targetUserId) => {
    const cacheKey = `${followerId}:${targetUserId}`;
    followCache.set(cacheKey, { isFollowing, timestamp: now });
  });
}

// ../lib/services/post-service.ts
var PostService = class extends BaseDocumentService {
  constructor() {
    super("post");
    this.statsCache = /* @__PURE__ */ new Map();
    // In-flight request deduplication for batch operations
    this.inFlightStats = /* @__PURE__ */ new Map();
    this.inFlightReplies = /* @__PURE__ */ new Map();
    this.inFlightParentOwners = /* @__PURE__ */ new Map();
    this.inFlightInteractions = /* @__PURE__ */ new Map();
    // In-flight request deduplication for count operations
    this.inFlightCountUserPosts = /* @__PURE__ */ new Map();
    this.inFlightCountAllPosts = null;
  }
  /** Create a cache key from an array of IDs */
  createBatchKey(ids) {
    return [...ids].sort().join(",");
  }
  /**
   * Transform document to Post type.
   * Returns a Post with default placeholder values - callers should use
   * enrichPostFull() or enrichPostsBatch() to populate stats and author data.
   */
  transformDocument(doc) {
    const data = doc.data || doc;
    const id = doc.$id || doc.id;
    const ownerId = doc.$ownerId || doc.ownerId;
    const createdAt = doc.$createdAt || doc.createdAt;
    const content = data.content || doc.content || "";
    const mediaUrl = data.mediaUrl || doc.mediaUrl;
    const rawReplyToId = data.replyToPostId || doc.replyToPostId;
    const replyToId = rawReplyToId ? identifierToBase58(rawReplyToId) || void 0 : void 0;
    const rawQuotedPostId = data.quotedPostId || doc.quotedPostId;
    const quotedPostId = rawQuotedPostId ? identifierToBase58(rawQuotedPostId) || void 0 : void 0;
    const post = {
      id,
      author: this.getDefaultUser(ownerId),
      content,
      createdAt: new Date(createdAt),
      likes: 0,
      reposts: 0,
      replies: 0,
      views: 0,
      liked: false,
      reposted: false,
      bookmarked: false,
      media: mediaUrl ? [{
        id: id + "-media",
        type: "image",
        url: mediaUrl
      }] : void 0,
      // Expose IDs for lazy loading at component level
      replyToId: replyToId || void 0,
      quotedPostId: quotedPostId || void 0
    };
    return post;
  }
  /**
   * Enrich post with background data (author, stats, interactions).
   * This is fire-and-forget - mutates the post object asynchronously.
   *
   * NOTE: Related entities (replyTo, quotedPost) are NOT fetched here.
   * Components that need them should fetch explicitly using the replyToId/quotedPostId fields.
   * This prevents cascade fetching and gives components control over what they load.
   */
  async enrichPost(post, postId, ownerId) {
    try {
      if (ownerId) {
        const author = await unifiedProfileService.getProfile(ownerId);
        if (author) {
          post.author = author;
        }
      }
      if (postId) {
        const stats = await this.getPostStats(postId);
        post.likes = stats.likes;
        post.reposts = stats.reposts;
        post.replies = stats.replies;
        post.views = stats.views;
        const interactions = await this.getUserInteractions(postId);
        post.liked = interactions.liked;
        post.reposted = interactions.reposted;
        post.bookmarked = interactions.bookmarked;
      }
    } catch (error) {
      console.error("Error enriching post:", error);
    }
  }
  /**
   * Enrich a single post with all data (stats, interactions, author).
   * This is the explicit, awaitable alternative to fire-and-forget enrichment.
   * Returns a new Post object with enriched data.
   */
  async enrichPostFull(post) {
    try {
      const [stats, interactions, author] = await Promise.all([
        this.getPostStats(post.id),
        this.getUserInteractions(post.id),
        unifiedProfileService.getProfileWithUsername(post.author.id)
      ]);
      const authorToUse = author || post.author;
      const hasDpns = authorToUse.username && !authorToUse.username.includes("...");
      return {
        ...post,
        likes: stats.likes,
        reposts: stats.reposts,
        replies: stats.replies,
        views: stats.views,
        liked: interactions.liked,
        reposted: interactions.reposted,
        bookmarked: interactions.bookmarked,
        author: {
          ...authorToUse,
          hasDpns
        }
      };
    } catch (error) {
      console.error("Error enriching post:", error);
      return post;
    }
  }
  /**
   * Batch fetch parent posts to get their owner IDs.
   * Deduplicates in-flight requests.
   * Returns a Map of postId -> ownerId
   */
  async getParentPostOwners(parentPostIds) {
    if (parentPostIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    const cacheKey = this.createBatchKey(parentPostIds);
    const inFlight = this.inFlightParentOwners.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
    const promise = this.fetchParentPostOwners(parentPostIds);
    this.inFlightParentOwners.set(cacheKey, promise);
    promise.finally(() => {
      setTimeout(() => this.inFlightParentOwners.delete(cacheKey), 100);
    });
    return promise;
  }
  /** Internal: Actually fetch parent post owners */
  async fetchParentPostOwners(parentPostIds) {
    const result = /* @__PURE__ */ new Map();
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const base58PostIds = parentPostIds.map((id) => identifierToBase58(id)).filter((id) => id !== null);
      if (base58PostIds.length === 0) {
        console.log("getParentPostOwners: No valid post IDs after conversion");
        return result;
      }
      console.log("getParentPostOwners: Querying", base58PostIds.length, "posts");
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "post",
        where: [["$id", "in", base58PostIds]],
        limit: base58PostIds.length
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === "function") {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      for (const doc of documents) {
        const postId = doc.$id;
        const ownerId = doc.$ownerId;
        if (postId && ownerId) {
          result.set(postId, ownerId);
        }
      }
    } catch (error) {
      console.error("Error fetching parent post owners:", error);
    }
    return result;
  }
  /**
   * Batch enrich multiple posts efficiently.
   * Uses batch queries to minimize network requests.
   * Returns new Post objects with enriched data including _enrichment for N+1 avoidance.
   */
  async enrichPostsBatch(posts) {
    if (posts.length === 0)
      return posts;
    try {
      const postIds = posts.map((p) => p.id);
      const authorIds = Array.from(new Set(posts.map((p) => p.author.id).filter(Boolean)));
      const parentPostIds = Array.from(new Set(
        posts.map((p) => p.replyToId).filter((id) => !!id)
      ));
      const currentUserId = this.getCurrentUserId();
      const [
        statsMap,
        interactionsMap,
        usernameMap,
        profiles,
        parentOwnerMap,
        blockStatusMap,
        followStatusMap,
        avatarUrlMap
      ] = await Promise.all([
        this.getBatchPostStats(postIds),
        this.getBatchUserInteractions(postIds),
        dpnsService.resolveUsernamesBatch(authorIds),
        unifiedProfileService.getProfilesByIdentityIds(authorIds),
        this.getParentPostOwners(parentPostIds),
        // Batch block/follow status (only if user is logged in)
        currentUserId ? blockService.checkBlockedBatch(currentUserId, authorIds) : Promise.resolve(/* @__PURE__ */ new Map()),
        currentUserId ? followService.getFollowStatusBatch(authorIds, currentUserId) : Promise.resolve(/* @__PURE__ */ new Map()),
        // Batch avatar URLs
        unifiedProfileService.getAvatarUrlsBatch(authorIds)
      ]);
      if (currentUserId) {
        seedBlockStatusCache(currentUserId, blockStatusMap);
        seedFollowStatusCache(currentUserId, followStatusMap);
      }
      const parentOwnerIds = Array.from(new Set(parentOwnerMap.values()));
      const parentUsernameMap = parentOwnerIds.length > 0 ? await dpnsService.resolveUsernamesBatch(parentOwnerIds) : /* @__PURE__ */ new Map();
      const profileMap = /* @__PURE__ */ new Map();
      profiles.forEach((profile) => {
        if (profile.$ownerId) {
          profileMap.set(profile.$ownerId, profile);
        }
      });
      return posts.map((post) => {
        const stats = statsMap.get(post.id);
        const interactions = interactionsMap.get(post.id);
        const username = usernameMap.get(post.author.id);
        const profile = profileMap.get(post.author.id);
        const profileData = profile?.data || profile;
        const authorIsBlocked = blockStatusMap.get(post.author.id) ?? false;
        const authorIsFollowing = followStatusMap.get(post.author.id) ?? false;
        const authorAvatarUrl = avatarUrlMap.get(post.author.id) ?? "";
        let replyTo = post.replyTo;
        if (post.replyToId && !replyTo) {
          const parentOwnerId = parentOwnerMap.get(post.replyToId);
          if (parentOwnerId) {
            const parentUsername = parentUsernameMap.get(parentOwnerId);
            replyTo = {
              id: post.replyToId,
              author: {
                id: parentOwnerId,
                username: parentUsername || `${parentOwnerId.slice(0, 8)}...`,
                displayName: parentUsername || "Unknown User",
                avatar: "",
                followers: 0,
                following: 0,
                verified: false,
                joinedAt: /* @__PURE__ */ new Date()
              },
              content: "",
              createdAt: /* @__PURE__ */ new Date(),
              likes: 0,
              reposts: 0,
              replies: 0,
              views: 0
            };
          }
        }
        return {
          ...post,
          likes: stats?.likes ?? post.likes,
          reposts: stats?.reposts ?? post.reposts,
          replies: stats?.replies ?? post.replies,
          views: stats?.views ?? post.views,
          liked: interactions?.liked ?? post.liked,
          reposted: interactions?.reposted ?? post.reposted,
          bookmarked: interactions?.bookmarked ?? post.bookmarked,
          replyTo,
          author: {
            ...post.author,
            username: username || post.author.username,
            displayName: profileData?.displayName || post.author.displayName,
            avatar: authorAvatarUrl || post.author.avatar,
            hasDpns: username ? true : false
          },
          // Pre-fetched enrichment data to avoid N+1 queries in PostCard
          _enrichment: {
            authorIsBlocked,
            authorIsFollowing,
            authorAvatarUrl
          }
        };
      });
    } catch (error) {
      console.error("Error batch enriching posts:", error);
      return posts;
    }
  }
  /**
   * Get a fully enriched post by ID.
   * Convenience method that fetches and enriches in one call.
   */
  async getEnrichedPostById(postId) {
    const post = await this.get(postId);
    if (!post)
      return null;
    return this.enrichPostFull(post);
  }
  /**
   * Create a new post
   */
  async createPost(ownerId, content, options = {}) {
    const data = {
      content
    };
    if (options.mediaUrl)
      data.mediaUrl = options.mediaUrl;
    if (options.replyToId)
      data.replyToPostId = options.replyToId;
    if (options.quotedPostId)
      data.quotedPostId = options.quotedPostId;
    if (options.firstMentionId)
      data.firstMentionId = options.firstMentionId;
    if (options.primaryHashtag)
      data.primaryHashtag = options.primaryHashtag;
    if (options.language)
      data.language = options.language || "en";
    if (options.sensitive !== void 0)
      data.sensitive = options.sensitive;
    return this.create(ownerId, data);
  }
  /**
   * Get timeline posts
   */
  async getTimeline(options = {}) {
    const defaultOptions2 = {
      // Need a where clause on orderBy field for Dash Platform to respect ordering
      where: [["$createdAt", ">", 0]],
      orderBy: [["$createdAt", "desc"]],
      limit: 20,
      ...options
    };
    return this.query(defaultOptions2);
  }
  /**
   * Get posts from followed users (following feed)
   * Uses compound query with $ownerId 'in' + $createdAt range via ownerAndTime index
   * to prevent prolific users from dominating the feed.
   *
   * Features adaptive window sizing based on post density to target ~50 posts per load.
   */
  async getFollowingFeed(userId, options = {}) {
    const TARGET_POSTS = 50;
    const DEFAULT_WINDOW_HOURS = 24;
    const MIN_WINDOW_HOURS = 1;
    try {
      const { followService: followService2 } = await Promise.resolve().then(() => (init_follow_service(), follow_service_exports));
      const following = await followService2.getFollowing(userId, { limit: 100 });
      const followingIds = [...following.map((f) => f.followingId), userId];
      if (followingIds.length === 0) {
        return { documents: [], nextCursor: void 0, prevCursor: void 0 };
      }
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const now = /* @__PURE__ */ new Date();
      const windowEndMs = options.timeWindowEnd?.getTime() || now.getTime();
      let windowHours = options.windowHours || DEFAULT_WINDOW_HOURS;
      windowHours = Math.max(MIN_WINDOW_HOURS, windowHours);
      let windowStartMs = options.timeWindowStart?.getTime() || windowEndMs - windowHours * 60 * 60 * 1e3;
      const executeQuery = async (whereClause) => {
        const queryParams = {
          dataContractId: this.contractId,
          documentTypeName: "post",
          where: whereClause,
          orderBy: [["$ownerId", "asc"], ["$createdAt", "asc"]],
          limit: 100
        };
        const response = await sdk.documents.query(queryParams);
        let documents;
        if (response instanceof Map) {
          documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
        } else if (Array.isArray(response)) {
          documents = response;
        } else if (response && response.documents) {
          documents = response.documents;
        } else if (response && typeof response.toJSON === "function") {
          const json = response.toJSON();
          documents = Array.isArray(json) ? json : json.documents || [];
        } else {
          documents = [];
        }
        return documents.map((doc) => this.transformDocument(doc));
      };
      const buildWhere = (startMs, endMs) => {
        const where = [
          ["$ownerId", "in", followingIds],
          ["$createdAt", ">=", startMs]
        ];
        if (endMs) {
          where.push(["$createdAt", "<", endMs]);
        }
        return where;
      };
      let posts = await executeQuery(
        buildWhere(windowStartMs, options.timeWindowEnd?.getTime())
      );
      let actualWindowHours = (windowEndMs - windowStartMs) / (60 * 60 * 1e3);
      if (posts.length === 100 && !options.timeWindowEnd) {
        let currentWindowMs = windowHours * 60 * 60 * 1e3;
        while (posts.length === 100) {
          currentWindowMs /= 2;
          windowStartMs = windowEndMs - currentWindowMs;
          posts = await executeQuery(buildWhere(windowStartMs));
          actualWindowHours = currentWindowMs / (60 * 60 * 1e3);
        }
      } else if (posts.length === 0 && !options.timeWindowEnd) {
        let currentWindowMs = windowHours * 60 * 60 * 1e3;
        const maxExpansions = 20;
        let expansions = 0;
        while (posts.length === 0 && expansions < maxExpansions) {
          currentWindowMs *= 2;
          windowStartMs = windowEndMs - currentWindowMs;
          posts = await executeQuery(buildWhere(windowStartMs));
          actualWindowHours = currentWindowMs / (60 * 60 * 1e3);
          expansions++;
        }
      }
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const postsPerHour = posts.length > 0 ? posts.length / actualWindowHours : 0;
      let suggestedNextWindowHours;
      if (postsPerHour > 0) {
        suggestedNextWindowHours = TARGET_POSTS / postsPerHour;
        suggestedNextWindowHours = Math.max(MIN_WINDOW_HOURS, suggestedNextWindowHours);
      } else {
        suggestedNextWindowHours = actualWindowHours * 2;
      }
      const nextWindowEnd = new Date(windowStartMs);
      const nextWindowStart = new Date(windowStartMs - suggestedNextWindowHours * 60 * 60 * 1e3);
      const exhaustedSearch = posts.length === 0 && !options.timeWindowEnd;
      return {
        documents: posts,
        nextCursor: exhaustedSearch ? void 0 : JSON.stringify({
          start: nextWindowStart.toISOString(),
          end: nextWindowEnd.toISOString(),
          windowHours: suggestedNextWindowHours
        }),
        prevCursor: void 0
      };
    } catch (error) {
      console.error("Error getting following feed:", error);
      return { documents: [], nextCursor: void 0, prevCursor: void 0 };
    }
  }
  /**
   * Get posts by user
   */
  async getUserPosts(userId, options = {}) {
    const queryOptions = {
      where: [["$ownerId", "==", userId]],
      orderBy: [["$ownerId", "asc"], ["$createdAt", "asc"]],
      limit: 20,
      ...options
    };
    const result = await this.query(queryOptions);
    result.documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return result;
  }
  /**
   * Get a single post by its document ID using direct lookup.
   * More efficient than querying all posts and filtering.
   * Awaits author resolution to prevent "Unknown User" race condition.
   *
   * @param postId - The post document ID
   * @param options - Query options (skipEnrichment to disable auto-enrichment)
   */
  async getPostById(postId, options = {}) {
    try {
      const post = await this.get(postId);
      if (!post)
        return null;
      if (!options.skipEnrichment) {
        await this.resolvePostAuthor(post);
      }
      return post;
    } catch (error) {
      console.error("Error getting post by ID:", error);
      return null;
    }
  }
  /**
   * Resolve and set the author for a post (awaited).
   * This prevents the "Unknown User" race condition for single post views.
   */
  async resolvePostAuthor(post) {
    if (!post.author?.id || post.author.id === "unknown")
      return;
    try {
      const author = await unifiedProfileService.getProfileWithUsername(post.author.id);
      if (author) {
        post.author = author;
      }
    } catch (error) {
      console.error("Error resolving post author:", error);
    }
  }
  /**
   * Count posts by user - uses direct SDK query for reliability.
   * Deduplicates in-flight requests.
   */
  async countUserPosts(userId) {
    const inFlight = this.inFlightCountUserPosts.get(userId);
    if (inFlight) {
      return inFlight;
    }
    const promise = this.fetchCountUserPosts(userId);
    this.inFlightCountUserPosts.set(userId, promise);
    promise.finally(() => {
      setTimeout(() => this.inFlightCountUserPosts.delete(userId), 100);
    });
    return promise;
  }
  async fetchCountUserPosts(userId) {
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "post",
        where: [["$ownerId", "==", userId]],
        orderBy: [["$createdAt", "asc"]],
        limit: 100
      });
      let documents;
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === "function") {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      } else {
        documents = [];
      }
      return documents.length;
    } catch (error) {
      console.error("Error counting user posts:", error);
      return 0;
    }
  }
  /**
   * Count all posts on the platform - paginates through all results.
   * Deduplicates in-flight requests.
   */
  async countAllPosts() {
    if (this.inFlightCountAllPosts) {
      return this.inFlightCountAllPosts;
    }
    const promise = this.fetchCountAllPosts();
    this.inFlightCountAllPosts = promise;
    promise.finally(() => {
      setTimeout(() => {
        this.inFlightCountAllPosts = null;
      }, 100);
    });
    return promise;
  }
  async fetchCountAllPosts() {
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      let totalCount = 0;
      let startAfter = void 0;
      const PAGE_SIZE = 100;
      while (true) {
        const queryParams = {
          dataContractId: this.contractId,
          documentTypeName: "post",
          orderBy: [["$createdAt", "asc"]],
          limit: PAGE_SIZE
        };
        if (startAfter) {
          queryParams.startAfter = startAfter;
        }
        const response = await sdk.documents.query(queryParams);
        let documents;
        if (response instanceof Map) {
          documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
        } else if (Array.isArray(response)) {
          documents = response;
        } else if (response && response.documents) {
          documents = response.documents;
        } else if (response && typeof response.toJSON === "function") {
          const json = response.toJSON();
          documents = Array.isArray(json) ? json : json.documents || [];
        } else {
          documents = [];
        }
        totalCount += documents.length;
        if (documents.length < PAGE_SIZE) {
          break;
        }
        const lastDoc = documents[documents.length - 1];
        if (!lastDoc.$id) {
          break;
        }
        startAfter = lastDoc.$id;
      }
      return totalCount;
    } catch (error) {
      console.error("Error counting all posts:", error);
      return 0;
    }
  }
  /**
   * Get replies to a post.
   * Awaits author resolution for all replies to prevent "Unknown User" race condition.
   *
   * @param postId - The parent post ID
   * @param options - Query options (including skipEnrichment to disable auto-enrichment)
   */
  async getReplies(postId, options = {}) {
    const { skipEnrichment, ...queryOpts } = options;
    const queryOptions = {
      where: [
        ["replyToPostId", "==", postId],
        ["$createdAt", ">", 0]
      ],
      orderBy: [["$createdAt", "asc"]],
      limit: 20,
      ...queryOpts
    };
    const result = await this.query(queryOptions);
    if (!skipEnrichment) {
      await Promise.all(result.documents.map((post) => this.resolvePostAuthor(post)));
    }
    return result;
  }
  /**
   * Get nested replies for multiple parent posts.
   * Returns a Map of parentPostId -> replies array.
   * Used for building 2-level threaded reply trees.
   */
  async getNestedReplies(parentPostIds, options = {}) {
    if (parentPostIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "post",
        where: [["replyToPostId", "in", parentPostIds]],
        orderBy: [["replyToPostId", "asc"]],
        limit: 100
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === "function") {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      const result = /* @__PURE__ */ new Map();
      parentPostIds.forEach((id) => result.set(id, []));
      for (const doc of documents) {
        const post = this.transformDocument(doc);
        const parentId = post.replyToId;
        if (parentId && result.has(parentId)) {
          result.get(parentId).push(post);
        }
      }
      result.forEach((replies) => {
        replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      });
      if (!options.skipEnrichment) {
        const allPosts = Array.from(result.values()).flat();
        await Promise.all(allPosts.map((p) => this.resolvePostAuthor(p)));
      }
      return result;
    } catch (error) {
      console.error("Error getting nested replies:", error);
      const result = /* @__PURE__ */ new Map();
      parentPostIds.forEach((id) => result.set(id, []));
      return result;
    }
  }
  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(hashtag, options = {}) {
    const queryOptions = {
      where: [["primaryHashtag", "==", hashtag.replace("#", "")]],
      orderBy: [["$createdAt", "desc"]],
      limit: 20,
      ...options
    };
    return this.query(queryOptions);
  }
  /**
   * Get post statistics (likes, reposts, replies)
   */
  async getPostStats(postId) {
    const cached = this.statsCache.get(postId);
    if (cached && Date.now() - cached.timestamp < 6e4) {
      return cached.data;
    }
    try {
      const [likes, reposts, replies] = await Promise.all([
        this.countLikes(postId),
        this.countReposts(postId),
        this.countReplies(postId)
      ]);
      const stats = {
        postId,
        likes,
        reposts,
        replies,
        views: 0
        // Views would need a separate tracking mechanism
      };
      this.statsCache.set(postId, {
        data: stats,
        timestamp: Date.now()
      });
      return stats;
    } catch (error) {
      console.error("Error getting post stats:", error);
      return { postId, likes: 0, reposts: 0, replies: 0, views: 0 };
    }
  }
  /**
   * Count likes for a post
   */
  async countLikes(postId) {
    const { likeService: likeService2 } = await Promise.resolve().then(() => (init_like_service(), like_service_exports));
    return likeService2.countLikes(postId);
  }
  /**
   * Count reposts for a post
   */
  async countReposts(postId) {
    const { repostService: repostService2 } = await Promise.resolve().then(() => (init_repost_service(), repost_service_exports));
    return repostService2.countReposts(postId);
  }
  /**
   * Count replies to a post
   */
  async countReplies(postId) {
    try {
      const result = await this.query({
        where: [
          ["replyToPostId", "==", postId],
          ["$createdAt", ">", 0]
        ],
        orderBy: [["$createdAt", "asc"]],
        limit: 100
      });
      return result.documents.length;
    } catch (error) {
      return 0;
    }
  }
  /**
   * Get user interactions with a post
   */
  async getUserInteractions(postId) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return { liked: false, reposted: false, bookmarked: false };
    }
    try {
      const [{ likeService: likeService2 }, { repostService: repostService2 }, { bookmarkService: bookmarkService2 }] = await Promise.all([
        Promise.resolve().then(() => (init_like_service(), like_service_exports)),
        Promise.resolve().then(() => (init_repost_service(), repost_service_exports)),
        Promise.resolve().then(() => (init_bookmark_service(), bookmark_service_exports))
      ]);
      const [liked, reposted, bookmarked] = await Promise.all([
        likeService2.isLiked(postId, currentUserId),
        repostService2.isReposted(postId, currentUserId),
        bookmarkService2.isBookmarked(postId, currentUserId)
      ]);
      return { liked, reposted, bookmarked };
    } catch (error) {
      console.error("Error getting user interactions:", error);
      return { liked: false, reposted: false, bookmarked: false };
    }
  }
  /**
   * Get current user ID from localStorage session
   */
  getCurrentUserId() {
    if (typeof window === "undefined")
      return null;
    try {
      const savedSession = localStorage.getItem("yappr_session");
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        return sessionData.user?.identityId || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  }
  /**
   * Get default user object when profile not found
   */
  getDefaultUser(userId) {
    const id = userId || "unknown";
    return {
      id,
      username: id.length > 8 ? id.substring(0, 8) + "..." : id,
      displayName: "Unknown User",
      avatar: "",
      bio: "",
      followers: 0,
      following: 0,
      verified: false,
      joinedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Public wrapper for getPostStats - for use by feed page
   */
  async getPostStatsPublic(postId) {
    return this.getPostStats(postId);
  }
  /**
   * Public wrapper for getUserInteractions - for use by feed page
   */
  async getUserInteractionsPublic(postId) {
    return this.getUserInteractions(postId);
  }
  /**
   * Batch get user interactions for multiple posts.
   * Deduplicates in-flight requests.
   */
  async getBatchUserInteractions(postIds) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || postIds.length === 0) {
      const result = /* @__PURE__ */ new Map();
      postIds.forEach((id) => result.set(id, { liked: false, reposted: false, bookmarked: false }));
      return result;
    }
    const cacheKey = `${currentUserId}:${this.createBatchKey(postIds)}`;
    const inFlight = this.inFlightInteractions.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
    const promise = this.fetchBatchUserInteractions(postIds, currentUserId);
    this.inFlightInteractions.set(cacheKey, promise);
    promise.finally(() => {
      setTimeout(() => this.inFlightInteractions.delete(cacheKey), 100);
    });
    return promise;
  }
  /** Internal: Actually fetch user interactions */
  async fetchBatchUserInteractions(postIds, currentUserId) {
    const result = /* @__PURE__ */ new Map();
    postIds.forEach((id) => {
      result.set(id, { liked: false, reposted: false, bookmarked: false });
    });
    try {
      const [{ likeService: likeService2 }, { repostService: repostService2 }, { bookmarkService: bookmarkService2 }] = await Promise.all([
        Promise.resolve().then(() => (init_like_service(), like_service_exports)),
        Promise.resolve().then(() => (init_repost_service(), repost_service_exports)),
        Promise.resolve().then(() => (init_bookmark_service(), bookmark_service_exports))
      ]);
      const [userLikes, userReposts, userBookmarks] = await Promise.all([
        likeService2.getUserLikes(currentUserId),
        repostService2.getUserReposts(currentUserId),
        bookmarkService2.getUserBookmarks(currentUserId)
      ]);
      const likedPostIds = new Set(userLikes.map((l) => l.postId));
      const repostedPostIds = new Set(userReposts.map((r) => r.postId));
      const bookmarkedPostIds = new Set(userBookmarks.map((b) => b.postId));
      postIds.forEach((postId) => {
        result.set(postId, {
          liked: likedPostIds.has(postId),
          reposted: repostedPostIds.has(postId),
          bookmarked: bookmarkedPostIds.has(postId)
        });
      });
    } catch (error) {
      console.error("Error getting batch user interactions:", error);
    }
    return result;
  }
  /**
   * Get reply counts for multiple posts in a single batch query.
   * Deduplicates in-flight requests.
   */
  async getRepliesByPostIds(postIds) {
    if (postIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    const cacheKey = this.createBatchKey(postIds);
    const inFlight = this.inFlightReplies.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
    const promise = this.fetchRepliesByPostIds(postIds);
    this.inFlightReplies.set(cacheKey, promise);
    promise.finally(() => {
      setTimeout(() => this.inFlightReplies.delete(cacheKey), 100);
    });
    return promise;
  }
  /** Internal: Actually fetch reply counts */
  async fetchRepliesByPostIds(postIds) {
    const result = /* @__PURE__ */ new Map();
    postIds.forEach((id) => result.set(id, 0));
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "post",
        where: [["replyToPostId", "in", postIds]],
        orderBy: [["replyToPostId", "asc"]],
        limit: 100
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === "function") {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      for (const doc of documents) {
        const data = doc.data || doc;
        const rawParentId = data.replyToPostId || doc.replyToPostId;
        const parentId = rawParentId ? identifierToBase58(rawParentId) : null;
        if (parentId && result.has(parentId)) {
          result.set(parentId, (result.get(parentId) || 0) + 1);
        }
      }
    } catch (error) {
      console.error("Error getting replies batch:", error);
    }
    return result;
  }
  /**
   * Batch get stats for multiple posts using efficient batch queries.
   * Deduplicates in-flight requests: multiple callers with same postIds share one request.
   */
  async getBatchPostStats(postIds) {
    if (postIds.length === 0) {
      return /* @__PURE__ */ new Map();
    }
    const cacheKey = this.createBatchKey(postIds);
    const inFlight = this.inFlightStats.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
    const promise = this.fetchBatchPostStats(postIds);
    this.inFlightStats.set(cacheKey, promise);
    promise.finally(() => {
      setTimeout(() => this.inFlightStats.delete(cacheKey), 100);
    });
    return promise;
  }
  /** Internal: Actually fetch batch post stats */
  async fetchBatchPostStats(postIds) {
    const result = /* @__PURE__ */ new Map();
    postIds.forEach((id) => {
      result.set(id, { postId: id, likes: 0, reposts: 0, replies: 0, views: 0 });
    });
    try {
      const [{ likeService: likeService2 }, { repostService: repostService2 }] = await Promise.all([
        Promise.resolve().then(() => (init_like_service(), like_service_exports)),
        Promise.resolve().then(() => (init_repost_service(), repost_service_exports))
      ]);
      const [likes, reposts, replyCounts] = await Promise.all([
        likeService2.getLikesByPostIds(postIds),
        repostService2.getRepostsByPostIds(postIds),
        this.getRepliesByPostIds(postIds)
      ]);
      for (const like of likes) {
        const stats = result.get(like.postId);
        if (stats)
          stats.likes++;
      }
      for (const repost of reposts) {
        const stats = result.get(repost.postId);
        if (stats)
          stats.reposts++;
      }
      replyCounts.forEach((count, postId) => {
        const stats = result.get(postId);
        if (stats)
          stats.replies = count;
      });
    } catch (error) {
      console.error("Error getting batch post stats:", error);
    }
    return result;
  }
  /**
   * Count unique authors across all posts
   * Paginates through all posts and counts unique $ownerId values
   */
  async countUniqueAuthors() {
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const uniqueAuthors = /* @__PURE__ */ new Set();
      let startAfter = void 0;
      const PAGE_SIZE = 100;
      while (true) {
        const queryParams = {
          dataContractId: this.contractId,
          documentTypeName: "post",
          where: [["$createdAt", ">", 0]],
          orderBy: [["$createdAt", "asc"]],
          limit: PAGE_SIZE
        };
        if (startAfter) {
          queryParams.startAfter = startAfter;
        }
        const response = await sdk.documents.query(queryParams);
        let documents;
        if (response instanceof Map) {
          documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
        } else if (Array.isArray(response)) {
          documents = response;
        } else if (response && response.documents) {
          documents = response.documents;
        } else if (response && typeof response.toJSON === "function") {
          const json = response.toJSON();
          documents = Array.isArray(json) ? json : json.documents || [];
        } else {
          documents = [];
        }
        for (const doc of documents) {
          if (doc.$ownerId) {
            uniqueAuthors.add(doc.$ownerId);
          }
        }
        if (documents.length < PAGE_SIZE) {
          break;
        }
        const lastDoc = documents[documents.length - 1];
        if (!lastDoc.$id) {
          break;
        }
        startAfter = lastDoc.$id;
      }
      return uniqueAuthors.size;
    } catch (error) {
      console.error("Error counting unique authors:", error);
      return 0;
    }
  }
  /**
   * Get top posts by like count
   * Fetches recent posts, gets their stats, and sorts by likes
   */
  async getTopPostsByLikes(limit = 5) {
    try {
      const result = await this.getTimeline({ limit: 50 });
      const posts = result.documents;
      if (posts.length === 0)
        return [];
      const postIds = posts.map((p) => p.id);
      const statsMap = await this.getBatchPostStats(postIds);
      const postsWithLikes = posts.map((post) => ({
        post,
        likes: statsMap.get(post.id)?.likes || 0
      }));
      postsWithLikes.sort((a, b) => b.likes - a.likes);
      const topPosts = postsWithLikes.slice(0, limit).map((p) => p.post);
      return this.enrichPostsBatch(topPosts);
    } catch (error) {
      console.error("Error getting top posts by likes:", error);
      return [];
    }
  }
  /**
   * Get post counts per author
   * Returns a Map of authorId -> post count
   */
  async getAuthorPostCounts(limit = 50) {
    const authorCounts = /* @__PURE__ */ new Map();
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      let startAfter = void 0;
      const PAGE_SIZE = 100;
      let totalProcessed = 0;
      const MAX_POSTS = 500;
      while (totalProcessed < MAX_POSTS) {
        const queryParams = {
          dataContractId: this.contractId,
          documentTypeName: "post",
          where: [["$createdAt", ">", 0]],
          orderBy: [["$createdAt", "desc"]],
          limit: PAGE_SIZE
        };
        if (startAfter) {
          queryParams.startAfter = startAfter;
        }
        const response = await sdk.documents.query(queryParams);
        let documents;
        if (response instanceof Map) {
          documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
        } else if (Array.isArray(response)) {
          documents = response;
        } else if (response && response.documents) {
          documents = response.documents;
        } else if (response && typeof response.toJSON === "function") {
          const json = response.toJSON();
          documents = Array.isArray(json) ? json : json.documents || [];
        } else {
          documents = [];
        }
        for (const doc of documents) {
          if (doc.$ownerId) {
            authorCounts.set(doc.$ownerId, (authorCounts.get(doc.$ownerId) || 0) + 1);
          }
        }
        totalProcessed += documents.length;
        if (documents.length < PAGE_SIZE) {
          break;
        }
        const lastDoc = documents[documents.length - 1];
        if (!lastDoc.$id) {
          break;
        }
        startAfter = lastDoc.$id;
      }
      return authorCounts;
    } catch (error) {
      console.error("Error getting author post counts:", error);
      return authorCounts;
    }
  }
  /**
   * Get posts that quote a specific post.
   * NOTE: The contract lacks a quotedPostId index, so this uses client-side
   * filtering of recent posts. For production, a contract migration adding
   * the index would improve efficiency.
   */
  async getQuotePosts(quotedPostId, options = {}) {
    const limit = options.limit || 50;
    try {
      const { getEvoSdk: getEvoSdk2 } = await Promise.resolve().then(() => (init_evo_sdk_service(), evo_sdk_service_exports));
      const sdk = await getEvoSdk2();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: "post",
        where: [["$createdAt", ">", 0]],
        orderBy: [["$createdAt", "desc"]],
        limit: 100
        // Scan recent posts
      });
      let documents = [];
      if (response instanceof Map) {
        documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
      } else if (Array.isArray(response)) {
        documents = response;
      } else if (response && response.documents) {
        documents = response.documents;
      } else if (response && typeof response.toJSON === "function") {
        const json = response.toJSON();
        documents = Array.isArray(json) ? json : json.documents || [];
      }
      const quotePosts = documents.map((doc) => this.transformDocument(doc)).filter((post) => post.quotedPostId === quotedPostId);
      return quotePosts.slice(0, limit);
    } catch (error) {
      console.error("Error getting quote posts:", error);
      return [];
    }
  }
  /**
   * Get multiple posts by their IDs.
   * Useful for fetching original posts when displaying reposts or quotes.
   * Author info is resolved for each post.
   */
  async getPostsByIds(postIds) {
    if (postIds.length === 0)
      return [];
    try {
      const BATCH_SIZE = 5;
      const posts = [];
      for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
        const batch = postIds.slice(i, i + BATCH_SIZE);
        const batchPosts = await Promise.all(
          batch.map((id) => this.getPostById(id))
          // Don't skip enrichment - resolve authors
        );
        posts.push(...batchPosts.filter((p) => p !== null));
      }
      return posts;
    } catch (error) {
      console.error("Error getting posts by IDs:", error);
      return [];
    }
  }
};
var postService = new PostService();

// src/hooks/useTimeline.ts
function useTimeline(options = {}) {
  const { limit = 20, feed = "global" } = options;
  const { identity: identity2 } = useIdentity();
  const [posts, setPosts] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2(null);
  const [cursor, setCursor] = useState2();
  const [hasMore, setHasMore] = useState2(true);
  const fetchPosts = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (feed === "following" && identity2?.identityId) {
        result = await postService.getFollowingFeed(identity2.identityId, {
          limit,
          startAfter: isRefresh ? void 0 : cursor
        });
      } else {
        result = await postService.getTimeline({
          limit,
          startAfter: isRefresh ? void 0 : cursor
        });
      }
      const enriched = await postService.enrichPostsBatch(result.documents);
      if (identity2?.identityId && enriched.length > 0) {
        const postIds = enriched.map((p) => p.id);
        const interactions = await postService.getBatchUserInteractions(
          postIds,
          identity2.identityId
        );
        for (const post of enriched) {
          const interaction = interactions.get(post.id);
          if (interaction) {
            post.liked = interaction.liked;
            post.reposted = interaction.reposted;
            post.bookmarked = interaction.bookmarked;
          }
        }
      }
      if (isRefresh) {
        setPosts(enriched);
      } else {
        setPosts((prev) => [...prev, ...enriched]);
      }
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor && enriched.length === limit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [feed, identity2?.identityId, limit, cursor]);
  useEffect3(() => {
    setPosts([]);
    setCursor(void 0);
    setHasMore(true);
    fetchPosts(true);
  }, [feed, identity2?.identityId]);
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts(false);
    }
  }, [loading, hasMore, fetchPosts]);
  const refresh = useCallback(async () => {
    setPosts([]);
    setCursor(void 0);
    setHasMore(true);
    await fetchPosts(true);
  }, [fetchPosts]);
  return { posts, loading, error, hasMore, loadMore, refresh };
}

// src/screens/Timeline.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
var tabs = [
  { label: "Global", key: "1" },
  { label: "Following", key: "2" }
];
var hints = [
  { key: "j/k", action: "navigate" },
  { key: "Enter", action: "open" },
  { key: "1/2", action: "switch tab" },
  { key: "r", action: "refresh" },
  { key: "/", action: "search" }
];
function Timeline({ initialFeed = "global" }) {
  const { push, activeTab, setActiveTab } = useNavigation();
  const { identity: identity2 } = useIdentity();
  const feed = activeTab === 0 ? "global" : "following";
  const { posts, loading, error, hasMore, loadMore, refresh } = useTimeline({ feed });
  useInput2((input) => {
    if (input === "1")
      setActiveTab(0);
    if (input === "2" && identity2)
      setActiveTab(1);
    if (input === "r")
      refresh();
  });
  const handleSelect = (post) => {
    push("post", { postId: post.id });
  };
  const handleAuthorClick = (post) => {
    push("user", { userId: post.author.id });
  };
  return /* @__PURE__ */ jsxs10(Screen, { title: "Yappr", subtitle: "Timeline", hints, children: [
    identity2 && /* @__PURE__ */ jsx11(TabBar, { tabs, activeIndex: activeTab }),
    loading && posts.length === 0 ? /* @__PURE__ */ jsx11(Spinner, { label: "Loading timeline..." }) : error ? /* @__PURE__ */ jsx11(Error2, { message: error }) : /* @__PURE__ */ jsx11(
      PostList,
      {
        posts,
        onSelect: handleSelect,
        onLoadMore: loadMore,
        hasMore
      }
    )
  ] });
}

// src/screens/PostDetail.tsx
import { Box as Box11, useInput as useInput3 } from "ink";

// src/hooks/usePost.ts
import { useState as useState3, useEffect as useEffect4, useCallback as useCallback2 } from "react";
function usePost(postId) {
  const { identity: identity2 } = useIdentity();
  const [post, setPost] = useState3(null);
  const [replies, setReplies] = useState3([]);
  const [loading, setLoading] = useState3(true);
  const [error, setError] = useState3(null);
  const fetchPost = useCallback2(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPost = await postService.getPostById(postId);
      if (!fetchedPost) {
        setError("Post not found");
        setPost(null);
        setReplies([]);
        return;
      }
      const enriched = await postService.enrichPostFull(fetchedPost);
      if (identity2?.identityId) {
        const interactions = await postService.getBatchUserInteractions(
          [postId],
          identity2.identityId
        );
        const interaction = interactions.get(postId);
        if (interaction) {
          enriched.liked = interaction.liked;
          enriched.reposted = interaction.reposted;
          enriched.bookmarked = interaction.bookmarked;
        }
      }
      if (enriched.quotedPostId && !enriched.quotedPost) {
        const quotedPost = await postService.getPostById(enriched.quotedPostId);
        if (quotedPost) {
          enriched.quotedPost = quotedPost;
        }
      }
      setPost(enriched);
      const repliesResult = await postService.getReplies(postId, { limit: 50 });
      const enrichedReplies = await postService.enrichPostsBatch(repliesResult.documents);
      setReplies(enrichedReplies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId, identity2?.identityId]);
  useEffect4(() => {
    fetchPost();
  }, [fetchPost]);
  return { post, replies, loading, error, refresh: fetchPost };
}

// src/screens/PostDetail.tsx
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
var hints2 = [
  { key: "j/k", action: "navigate replies" },
  { key: "Enter", action: "open reply" },
  { key: "a", action: "view author" },
  { key: "r", action: "refresh" },
  { key: "b", action: "back" }
];
function PostDetail({ postId }) {
  const { push } = useNavigation();
  const { post, replies, loading, error, refresh } = usePost(postId);
  useInput3((input) => {
    if (input === "r")
      refresh();
    if (input === "a" && post) {
      push("user", { userId: post.author.id });
    }
  });
  const handleReplySelect = (reply) => {
    push("post", { postId: reply.id });
  };
  if (loading && !post) {
    return /* @__PURE__ */ jsx12(Screen, { title: "Post", hints: hints2, children: /* @__PURE__ */ jsx12(Spinner, { label: "Loading post..." }) });
  }
  if (error || !post) {
    return /* @__PURE__ */ jsx12(Screen, { title: "Post", hints: hints2, children: /* @__PURE__ */ jsx12(Error2, { message: error || "Post not found" }) });
  }
  return /* @__PURE__ */ jsx12(Screen, { title: "Post", subtitle: `by @${post.author.username || "unknown"}`, hints: hints2, children: /* @__PURE__ */ jsxs11(Box11, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx12(PostFull, { post }),
    replies.length > 0 && /* @__PURE__ */ jsx12(Box11, { flexDirection: "column", marginTop: 1, children: /* @__PURE__ */ jsx12(
      PostList,
      {
        posts: replies,
        onSelect: handleReplySelect,
        showReplyTo: true
      }
    ) })
  ] }) });
}

// src/screens/UserProfile.tsx
import { Box as Box14, useInput as useInput4 } from "ink";

// src/components/user/UserCard.tsx
import { Box as Box12, Text as Text9 } from "ink";
import { jsx as jsx13, jsxs as jsxs12 } from "react/jsx-runtime";
function UserCard({ user, selected, showFollowStatus, isFollowing }) {
  const indicator = selected ? colors.primary("\u25B6 ") : "  ";
  return /* @__PURE__ */ jsxs12(
    Box12,
    {
      flexDirection: "column",
      paddingX: 1,
      borderStyle: selected ? "single" : void 0,
      borderColor: selected ? "cyan" : void 0,
      children: [
        /* @__PURE__ */ jsxs12(Box12, { children: [
          /* @__PURE__ */ jsx13(Text9, { children: indicator }),
          /* @__PURE__ */ jsxs12(Text9, { children: [
            styled.displayName(truncate(user.displayName || user.username, 25)),
            " "
          ] }),
          /* @__PURE__ */ jsx13(Text9, { children: styled.username(user.username || user.id.slice(0, 8)) }),
          showFollowStatus && isFollowing && /* @__PURE__ */ jsx13(Text9, { color: "green", children: " \\u2713 Following" })
        ] }),
        user.bio && /* @__PURE__ */ jsx13(Box12, { marginLeft: 2, children: /* @__PURE__ */ jsx13(Text9, { dimColor: true, children: truncate(user.bio, 60) }) }),
        /* @__PURE__ */ jsxs12(Box12, { marginLeft: 2, gap: 2, children: [
          /* @__PURE__ */ jsxs12(Text9, { dimColor: true, children: [
            /* @__PURE__ */ jsx13(Text9, { bold: true, children: formatNumber(user.followers) }),
            " followers"
          ] }),
          /* @__PURE__ */ jsxs12(Text9, { dimColor: true, children: [
            /* @__PURE__ */ jsx13(Text9, { bold: true, children: formatNumber(user.following) }),
            " following"
          ] })
        ] }),
        /* @__PURE__ */ jsx13(Text9, { children: " " })
      ]
    }
  );
}

// src/components/user/ProfileHeader.tsx
import { Box as Box13, Text as Text10 } from "ink";
import { jsx as jsx14, jsxs as jsxs13 } from "react/jsx-runtime";
function ProfileHeader({ user, isFollowing, isOwnProfile, balance }) {
  const width = getContentWidth();
  return /* @__PURE__ */ jsxs13(Box13, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsxs13(Box13, { children: [
      /* @__PURE__ */ jsx14(Text10, { children: styled.displayName(user.displayName || user.username) }),
      user.verified && /* @__PURE__ */ jsx14(Text10, { color: "cyan", children: " \\u2713" })
    ] }),
    /* @__PURE__ */ jsxs13(Box13, { marginBottom: 1, children: [
      /* @__PURE__ */ jsx14(Text10, { children: styled.username(user.username || user.id.slice(0, 8)) }),
      isOwnProfile && /* @__PURE__ */ jsx14(Text10, { dimColor: true, children: " (you)" }),
      !isOwnProfile && isFollowing && /* @__PURE__ */ jsx14(Text10, { color: "green", children: " Following" })
    ] }),
    user.bio && /* @__PURE__ */ jsx14(Box13, { flexDirection: "column", marginBottom: 1, children: wrapText(user.bio, width - 2).map((line, i) => /* @__PURE__ */ jsx14(Text10, { children: line }, i)) }),
    /* @__PURE__ */ jsxs13(Box13, { gap: 3, marginBottom: 1, children: [
      user.location && /* @__PURE__ */ jsxs13(Text10, { dimColor: true, children: [
        "@ ",
        user.location
      ] }),
      user.website && /* @__PURE__ */ jsxs13(Text10, { dimColor: true, children: [
        "~ ",
        user.website
      ] }),
      user.pronouns && /* @__PURE__ */ jsx14(Text10, { dimColor: true, children: user.pronouns })
    ] }),
    user.socialLinks && user.socialLinks.length > 0 && /* @__PURE__ */ jsx14(Box13, { gap: 2, marginBottom: 1, children: user.socialLinks.map((link, i) => /* @__PURE__ */ jsxs13(Text10, { dimColor: true, children: [
      link.platform,
      ": ",
      link.handle
    ] }, i)) }),
    /* @__PURE__ */ jsx14(Text10, { children: horizontalLine(width - 2) }),
    /* @__PURE__ */ jsxs13(Box13, { gap: 3, marginY: 1, children: [
      /* @__PURE__ */ jsxs13(Text10, { children: [
        /* @__PURE__ */ jsx14(Text10, { bold: true, children: formatNumber(user.followers) }),
        /* @__PURE__ */ jsx14(Text10, { dimColor: true, children: " Followers" })
      ] }),
      /* @__PURE__ */ jsxs13(Text10, { children: [
        /* @__PURE__ */ jsx14(Text10, { bold: true, children: formatNumber(user.following) }),
        /* @__PURE__ */ jsx14(Text10, { dimColor: true, children: " Following" })
      ] }),
      balance !== void 0 && /* @__PURE__ */ jsx14(Text10, { children: /* @__PURE__ */ jsx14(Text10, { bold: true, children: formatCredits(balance) }) })
    ] }),
    /* @__PURE__ */ jsx14(Text10, { children: horizontalLine(width - 2) }),
    user.paymentUris && user.paymentUris.length > 0 && /* @__PURE__ */ jsxs13(Box13, { flexDirection: "column", marginTop: 1, children: [
      /* @__PURE__ */ jsx14(Text10, { dimColor: true, children: "Payment:" }),
      user.paymentUris.map((uri, i) => /* @__PURE__ */ jsxs13(Text10, { dimColor: true, children: [
        uri.label || uri.scheme,
        ": ",
        uri.uri
      ] }, i))
    ] })
  ] });
}

// src/components/user/UserList.tsx
import { jsx as jsx15 } from "react/jsx-runtime";
function UserList({
  users,
  onSelect,
  onLoadMore,
  hasMore,
  height,
  showFollowStatus,
  followingIds
}) {
  if (users.length === 0) {
    return /* @__PURE__ */ jsx15(Empty, { message: "No users found" });
  }
  return /* @__PURE__ */ jsx15(
    ScrollList,
    {
      items: users,
      height,
      hasMore,
      onLoadMore,
      onSelect: (user) => onSelect?.(user),
      renderItem: (user, index, isSelected) => /* @__PURE__ */ jsx15(
        UserCard,
        {
          user,
          selected: isSelected,
          showFollowStatus,
          isFollowing: followingIds?.has(user.id)
        }
      )
    }
  );
}

// src/hooks/useProfile.ts
import { useState as useState4, useEffect as useEffect5, useCallback as useCallback3 } from "react";

// ../lib/services/profile-service.ts
init_document_service();
init_evo_sdk_service();
function getDefaultAvatarUrl(userId) {
  if (!userId)
    return "";
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userId)}`;
}
var ProfileService = class extends BaseDocumentService {
  constructor() {
    super("profile");
    this.USERNAME_CACHE = "usernames";
    this.PROFILE_CACHE = "profiles";
  }
  /**
   * Override query to handle cached username
   */
  async query(options = {}) {
    try {
      const sdk = await getEvoSdk();
      const queryParams = {
        dataContractId: this.contractId,
        documentTypeName: this.documentType
      };
      if (options.where) {
        queryParams.where = options.where;
      }
      if (options.orderBy) {
        queryParams.orderBy = options.orderBy;
      }
      if (options.limit) {
        queryParams.limit = options.limit;
      }
      if (options.startAfter) {
        queryParams.startAfter = options.startAfter;
      } else if (options.startAt) {
        queryParams.startAt = options.startAt;
      }
      console.log(`Querying ${this.documentType} documents:`, queryParams);
      const response = await sdk.documents.query(queryParams);
      console.log(`${this.documentType} query result:`, response);
      if (response instanceof Map) {
        const documents2 = [];
        const entries = Array.from(response.values());
        for (const doc of entries) {
          if (doc) {
            const docData = typeof doc.toJSON === "function" ? doc.toJSON() : doc;
            documents2.push(this.transformDocument(docData, { cachedUsername: this.cachedUsername }));
          }
        }
        return {
          documents: documents2,
          nextCursor: void 0,
          prevCursor: void 0
        };
      }
      let result = response;
      if (response && typeof response.toJSON === "function") {
        result = response.toJSON();
      }
      if (Array.isArray(result)) {
        const documents2 = result.map((doc) => {
          return this.transformDocument(doc, { cachedUsername: this.cachedUsername });
        });
        return {
          documents: documents2,
          nextCursor: void 0,
          prevCursor: void 0
        };
      }
      const documents = result?.documents?.map((doc) => {
        return this.transformDocument(doc, { cachedUsername: this.cachedUsername });
      }) || [];
      return {
        documents,
        nextCursor: result?.nextCursor,
        prevCursor: result?.prevCursor
      };
    } catch (error) {
      console.error(`Error querying ${this.documentType} documents:`, error);
      throw error;
    }
  }
  /**
   * Transform document to User type
   * SDK v3: System fields use $ prefix
   */
  transformDocument(doc, options) {
    console.log("ProfileService: transformDocument input:", doc);
    const profileDoc = doc;
    const cachedUsername = options?.cachedUsername;
    const ownerId = profileDoc.$ownerId || doc.ownerId;
    const createdAt = profileDoc.$createdAt || doc.createdAt;
    const docId = profileDoc.$id || doc.id;
    const revision = profileDoc.$revision || doc.revision;
    const data = doc.data || doc;
    const rawDisplayName = (data.displayName || "").trim();
    const ownerIdStr = ownerId || "unknown";
    const user = {
      id: ownerIdStr,
      documentId: docId,
      // Store document id for updates
      $revision: revision,
      // Store revision for updates
      username: cachedUsername || ownerIdStr.substring(0, 8) + "...",
      displayName: rawDisplayName || cachedUsername || ownerIdStr.substring(0, 8) + "...",
      avatar: getDefaultAvatarUrl(ownerIdStr),
      bio: data.bio,
      followers: 0,
      following: 0,
      verified: false,
      joinedAt: new Date(createdAt)
    };
    this.enrichUser(user, !!cachedUsername);
    return user;
  }
  /**
   * Enrich user with async data
   */
  async enrichUser(user, skipUsernameResolution) {
    try {
      if (!skipUsernameResolution && user.username === user.id.substring(0, 8) + "...") {
        const username = await this.getUsername(user.id);
        if (username) {
          user.username = username;
        }
      }
      const stats = await this.getUserStats(user.id);
      user.followers = stats.followers;
      user.following = stats.following;
    } catch (error) {
      console.error("Error enriching user:", error);
    }
  }
  /**
   * Get profile by owner ID
   */
  async getProfile(ownerId, cachedUsername) {
    try {
      console.log("ProfileService: Getting profile for owner ID:", ownerId);
      const cached = cacheManager.get(this.PROFILE_CACHE, ownerId);
      if (cached) {
        console.log("ProfileService: Returning cached profile for:", ownerId);
        if (cachedUsername && cached.username !== cachedUsername) {
          cached.username = cachedUsername;
        }
        return cached;
      }
      this.cachedUsername = cachedUsername;
      const result = await this.query({
        where: [["$ownerId", "==", ownerId]],
        limit: 1
      });
      console.log("ProfileService: Query result:", result);
      console.log("ProfileService: Documents found:", result.documents.length);
      if (result.documents.length > 0) {
        const profile = result.documents[0];
        console.log("ProfileService: Returning profile:", profile);
        cacheManager.set(this.PROFILE_CACHE, ownerId, profile, {
          ttl: 3e5,
          // 5 minutes
          tags: ["profile", `user:${ownerId}`]
        });
        return profile;
      }
      console.log("ProfileService: No profile found for owner ID:", ownerId);
      return null;
    } catch (error) {
      console.error("ProfileService: Error getting profile:", error);
      return null;
    } finally {
      this.cachedUsername = void 0;
    }
  }
  /**
   * Get profile by owner ID with username fully resolved (awaited).
   * Use this when you need the username to be available immediately.
   */
  async getProfileWithUsername(ownerId) {
    try {
      const username = await this.getUsername(ownerId);
      const profile = await this.getProfile(ownerId, username || void 0);
      if (profile && username) {
        profile.username = username;
      }
      return profile;
    } catch (error) {
      console.error("ProfileService: Error getting profile with username:", error);
      return this.getProfile(ownerId);
    }
  }
  /**
   * Create user profile
   */
  async createProfile(ownerId, displayName, bio) {
    const data = {
      displayName,
      bio: bio || ""
    };
    const result = await this.create(ownerId, data);
    cacheManager.invalidateByTag(`user:${ownerId}`);
    return result;
  }
  /**
   * Update user profile
   */
  async updateProfile(ownerId, updates) {
    try {
      cacheManager.invalidateByTag(`user:${ownerId}`);
      const profile = await this.getProfile(ownerId);
      if (!profile) {
        throw new Error("Profile not found");
      }
      const data = {};
      if (updates.displayName !== void 0) {
        data.displayName = updates.displayName.trim();
      }
      if (updates.bio !== void 0 && updates.bio.trim() !== "") {
        data.bio = updates.bio.trim();
      }
      if (updates.location !== void 0 && updates.location.trim() !== "") {
        data.location = updates.location.trim();
      }
      if (updates.website !== void 0 && updates.website.trim() !== "") {
        data.website = updates.website.trim();
      }
      const profileDoc = await this.query({
        where: [["$ownerId", "==", ownerId]],
        limit: 1
      });
      if (profileDoc.documents.length > 0) {
        const docId = profileDoc.documents[0].documentId;
        if (!docId) {
          throw new Error("Profile document ID not found");
        }
        const result = await this.update(docId, ownerId, data);
        cacheManager.invalidateByTag(`user:${ownerId}`);
        return result;
      }
      return null;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
  /**
   * Get username from DPNS
   */
  async getUsername(ownerId) {
    const cached = cacheManager.get(this.USERNAME_CACHE, ownerId);
    if (cached) {
      return cached;
    }
    try {
      const username = await dpnsService.resolveUsername(ownerId);
      if (username) {
        cacheManager.set(this.USERNAME_CACHE, ownerId, username, {
          ttl: 3e5,
          // 5 minutes
          tags: ["username", `user:${ownerId}`]
        });
      }
      return username;
    } catch (error) {
      console.error("Error resolving username:", error);
      return null;
    }
  }
  /**
   * Get user statistics (followers/following)
   */
  async getUserStats(userId) {
    return {
      followers: 0,
      following: 0
    };
  }
  /**
   * Get profiles by array of identity IDs
   */
  async getProfilesByIdentityIds(identityIds) {
    try {
      if (identityIds.length === 0) {
        return [];
      }
      const bs58 = (await Promise.resolve().then(() => (init_esm2(), esm_exports))).default;
      const validIds = identityIds.filter((id) => {
        if (!id || id === "unknown")
          return false;
        try {
          const decoded = bs58.decode(id);
          return decoded.length === 32;
        } catch {
          return false;
        }
      });
      if (validIds.length === 0) {
        console.log("ProfileService: No valid identity IDs to query");
        return [];
      }
      console.log("ProfileService: Getting profiles for", validIds.length, "identity IDs");
      const sdk = await getEvoSdk();
      const response = await sdk.documents.query({
        dataContractId: this.contractId,
        documentTypeName: this.documentType,
        where: [["$ownerId", "in", validIds]],
        orderBy: [["$ownerId", "asc"]],
        limit: 100
      });
      if (response instanceof Map) {
        const documents = Array.from(response.values()).filter(Boolean).map((doc) => typeof doc.toJSON === "function" ? doc.toJSON() : doc);
        console.log(`ProfileService: Found ${documents.length} profiles`);
        return documents;
      }
      const anyResponse = response;
      if (Array.isArray(anyResponse)) {
        console.log(`ProfileService: Found ${anyResponse.length} profiles`);
        return anyResponse;
      } else if (anyResponse && anyResponse.documents) {
        console.log(`ProfileService: Found ${anyResponse.documents.length} profiles`);
        return anyResponse.documents;
      }
      return [];
    } catch (error) {
      console.error("ProfileService: Error getting profiles by identity IDs:", error);
      return [];
    }
  }
};
var profileService = new ProfileService();

// src/hooks/useProfile.ts
init_follow_service();
init_like_service();
function useProfile(userId, username) {
  const { identity: identity2 } = useIdentity();
  const [user, setUser] = useState4(null);
  const [posts, setPosts] = useState4([]);
  const [likedPosts, setLikedPosts] = useState4([]);
  const [isFollowing, setIsFollowing] = useState4(false);
  const [balance, setBalance] = useState4(null);
  const [loading, setLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const [resolvedUserId, setResolvedUserId] = useState4(null);
  const fetchProfile = useCallback3(async () => {
    setLoading(true);
    setError(null);
    try {
      let targetUserId = userId;
      if (!targetUserId && username) {
        const resolved = await dpnsService.resolveIdentity(username);
        if (!resolved) {
          setError(`User @${username} not found`);
          return;
        }
        targetUserId = resolved;
      }
      if (!targetUserId) {
        setError("No user specified");
        return;
      }
      setResolvedUserId(targetUserId);
      const profile = await profileService.getProfileWithUsername(targetUserId);
      if (!profile) {
        setError("Profile not found");
        return;
      }
      setUser(profile);
      if (identity2?.identityId === targetUserId) {
        const identityInfo = await identityService.getIdentity(targetUserId);
        setBalance(identityInfo?.balance ?? null);
      }
      if (identity2?.identityId && identity2.identityId !== targetUserId) {
        const following = await followService.isFollowing(targetUserId, identity2.identityId);
        setIsFollowing(following);
      }
      const postsResult = await postService.getUserPosts(targetUserId, { limit: 20 });
      const enrichedPosts = await postService.enrichPostsBatch(postsResult.documents);
      setPosts(enrichedPosts);
      const likes = await likeService.getUserLikes(targetUserId, { limit: 20 });
      if (likes.length > 0) {
        const likedPostIds = likes.map((l) => l.postId);
        const likedPostDocs = await postService.getPostsByIds(likedPostIds);
        setLikedPosts(likedPostDocs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId, username, identity2?.identityId]);
  useEffect5(() => {
    fetchProfile();
  }, [fetchProfile]);
  const loadMorePosts = useCallback3(async () => {
  }, []);
  const loadMoreLikes = useCallback3(async () => {
  }, []);
  return {
    user,
    posts,
    likedPosts,
    isFollowing,
    balance,
    loading,
    error,
    refresh: fetchProfile,
    loadMorePosts,
    loadMoreLikes
  };
}

// src/screens/UserProfile.tsx
import { jsx as jsx16, jsxs as jsxs14 } from "react/jsx-runtime";
var tabs2 = [
  { label: "Posts", key: "1" },
  { label: "Likes", key: "2" }
];
var hints3 = [
  { key: "j/k", action: "navigate" },
  { key: "Enter", action: "open post" },
  { key: "1/2", action: "switch tab" },
  { key: "f", action: "followers" },
  { key: "g", action: "following" },
  { key: "r", action: "refresh" }
];
function UserProfile({ userId, username }) {
  const { push, activeTab, setActiveTab } = useNavigation();
  const { identity: identity2 } = useIdentity();
  const {
    user,
    posts,
    likedPosts,
    isFollowing,
    balance,
    loading,
    error,
    refresh
  } = useProfile(userId, username);
  const isOwnProfile = identity2?.identityId === user?.id;
  useInput4((input) => {
    if (input === "1")
      setActiveTab(0);
    if (input === "2")
      setActiveTab(1);
    if (input === "r")
      refresh();
    if (input === "f" && user) {
      push("followers", { userId: user.id, mode: "followers" });
    }
    if (input === "g" && user) {
      push("followers", { userId: user.id, mode: "following" });
    }
  });
  const handlePostSelect = (post) => {
    push("post", { postId: post.id });
  };
  if (loading && !user) {
    return /* @__PURE__ */ jsx16(Screen, { title: "Profile", hints: hints3, children: /* @__PURE__ */ jsx16(Spinner, { label: "Loading profile..." }) });
  }
  if (error || !user) {
    return /* @__PURE__ */ jsx16(Screen, { title: "Profile", hints: hints3, children: /* @__PURE__ */ jsx16(Error2, { message: error || "User not found" }) });
  }
  const displayPosts = activeTab === 0 ? posts : likedPosts;
  const emptyMessage = activeTab === 0 ? "No posts yet" : "No liked posts";
  return /* @__PURE__ */ jsx16(
    Screen,
    {
      title: user.displayName || user.username,
      subtitle: `@${user.username}`,
      hints: hints3,
      children: /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", children: [
        /* @__PURE__ */ jsx16(
          ProfileHeader,
          {
            user,
            isFollowing,
            isOwnProfile,
            balance: isOwnProfile ? balance ?? void 0 : void 0
          }
        ),
        /* @__PURE__ */ jsx16(TabBar, { tabs: tabs2, activeIndex: activeTab }),
        displayPosts.length === 0 ? /* @__PURE__ */ jsx16(Empty, { message: emptyMessage }) : /* @__PURE__ */ jsx16(PostList, { posts: displayPosts, onSelect: handlePostSelect })
      ] })
    }
  );
}

// src/screens/Search.tsx
import { useState as useState7, useEffect as useEffect7 } from "react";
import { Box as Box15, Text as Text12, useInput as useInput6 } from "ink";

// node_modules/ink-text-input/build/index.js
import React3, { useState as useState5, useEffect as useEffect6 } from "react";
import { Text as Text11, useInput as useInput5 } from "ink";
function TextInput({ value: originalValue, placeholder = "", focus = true, mask, highlightPastedText = false, showCursor = true, onChange, onSubmit }) {
  const [state, setState] = useState5({
    cursorOffset: (originalValue || "").length,
    cursorWidth: 0
  });
  const { cursorOffset, cursorWidth } = state;
  useEffect6(() => {
    setState((previousState) => {
      if (!focus || !showCursor) {
        return previousState;
      }
      const newValue = originalValue || "";
      if (previousState.cursorOffset > newValue.length - 1) {
        return {
          cursorOffset: newValue.length,
          cursorWidth: 0
        };
      }
      return previousState;
    });
  }, [originalValue, focus, showCursor]);
  const cursorActualWidth = highlightPastedText ? cursorWidth : 0;
  const value = mask ? mask.repeat(originalValue.length) : originalValue;
  let renderedValue = value;
  let renderedPlaceholder = placeholder ? source_default.grey(placeholder) : void 0;
  if (showCursor && focus) {
    renderedPlaceholder = placeholder.length > 0 ? source_default.inverse(placeholder[0]) + source_default.grey(placeholder.slice(1)) : source_default.inverse(" ");
    renderedValue = value.length > 0 ? "" : source_default.inverse(" ");
    let i = 0;
    for (const char of value) {
      renderedValue += i >= cursorOffset - cursorActualWidth && i <= cursorOffset ? source_default.inverse(char) : char;
      i++;
    }
    if (value.length > 0 && cursorOffset === value.length) {
      renderedValue += source_default.inverse(" ");
    }
  }
  useInput5((input, key) => {
    if (key.upArrow || key.downArrow || key.ctrl && input === "c" || key.tab || key.shift && key.tab) {
      return;
    }
    if (key.return) {
      if (onSubmit) {
        onSubmit(originalValue);
      }
      return;
    }
    let nextCursorOffset = cursorOffset;
    let nextValue = originalValue;
    let nextCursorWidth = 0;
    if (key.leftArrow) {
      if (showCursor) {
        nextCursorOffset--;
      }
    } else if (key.rightArrow) {
      if (showCursor) {
        nextCursorOffset++;
      }
    } else if (key.backspace || key.delete) {
      if (cursorOffset > 0) {
        nextValue = originalValue.slice(0, cursorOffset - 1) + originalValue.slice(cursorOffset, originalValue.length);
        nextCursorOffset--;
      }
    } else {
      nextValue = originalValue.slice(0, cursorOffset) + input + originalValue.slice(cursorOffset, originalValue.length);
      nextCursorOffset += input.length;
      if (input.length > 1) {
        nextCursorWidth = input.length;
      }
    }
    if (cursorOffset < 0) {
      nextCursorOffset = 0;
    }
    if (cursorOffset > originalValue.length) {
      nextCursorOffset = originalValue.length;
    }
    setState({
      cursorOffset: nextCursorOffset,
      cursorWidth: nextCursorWidth
    });
    if (nextValue !== originalValue) {
      onChange(nextValue);
    }
  }, { isActive: focus });
  return React3.createElement(Text11, null, placeholder ? value.length > 0 ? renderedValue : renderedPlaceholder : renderedValue);
}
var build_default = TextInput;

// src/hooks/useSearch.ts
import { useState as useState6, useCallback as useCallback4 } from "react";
function useSearch() {
  const [results, setResults] = useState6([]);
  const [loading, setLoading] = useState6(false);
  const [error, setError] = useState6(null);
  const search = useCallback4(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const searchResults = await dpnsService.searchUsernamesWithDetails(query, 20);
      if (searchResults.length === 0) {
        setResults([]);
        return;
      }
      const userIds = searchResults.map((r) => r.ownerId);
      const profiles = await profileService.getProfilesByIdentityIds(userIds);
      const users = searchResults.map((result) => {
        const profile = profiles.find((p) => p.$ownerId === result.ownerId);
        return {
          id: result.ownerId,
          username: result.username,
          displayName: profile?.displayName || result.username,
          avatar: "",
          // Would be generated from ID
          bio: profile?.bio,
          followers: 0,
          // Would need separate fetch
          following: 0,
          joinedAt: /* @__PURE__ */ new Date()
        };
      });
      setResults(users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);
  const clear = useCallback4(() => {
    setResults([]);
    setError(null);
  }, []);
  return { results, loading, error, search, clear };
}

// src/screens/Search.tsx
import { jsx as jsx17, jsxs as jsxs15 } from "react/jsx-runtime";
var hints4 = [
  { key: "Enter", action: "search/select" },
  { key: "j/k", action: "navigate results" },
  { key: "Esc", action: "back" }
];
function Search({ initialQuery = "" }) {
  const { push, pop, setSelectedIndex } = useNavigation();
  const { results, loading, error, search, clear } = useSearch();
  const [query, setQuery] = useState7(initialQuery);
  const [isEditing, setIsEditing] = useState7(true);
  useEffect7(() => {
    if (initialQuery) {
      search(initialQuery);
      setIsEditing(false);
    }
  }, []);
  useInput6((input, key) => {
    if (isEditing) {
      if (key.return && query.length >= 2) {
        search(query);
        setIsEditing(false);
        setSelectedIndex(0);
      }
    } else {
      if (input === "/") {
        setIsEditing(true);
      }
    }
  });
  const handleQueryChange = (value) => {
    setQuery(value);
  };
  const handleUserSelect = (user) => {
    push("user", { userId: user.id });
  };
  return /* @__PURE__ */ jsx17(Screen, { title: "Search", subtitle: "Find users", hints: hints4, children: /* @__PURE__ */ jsxs15(Box15, { flexDirection: "column", children: [
    /* @__PURE__ */ jsxs15(Box15, { paddingX: 1, marginBottom: 1, children: [
      /* @__PURE__ */ jsx17(Text12, { color: "cyan", children: "Search: " }),
      isEditing ? /* @__PURE__ */ jsx17(
        build_default,
        {
          value: query,
          onChange: handleQueryChange,
          placeholder: "Enter username..."
        }
      ) : /* @__PURE__ */ jsxs15(Text12, { children: [
        query,
        /* @__PURE__ */ jsx17(Text12, { dimColor: true, children: " (press / to edit)" })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx17(Spinner, { label: "Searching..." }) : error ? /* @__PURE__ */ jsx17(Box15, { paddingX: 1, children: /* @__PURE__ */ jsx17(Text12, { color: "red", children: error }) }) : results.length === 0 && query.length >= 2 ? /* @__PURE__ */ jsx17(Empty, { message: "No users found", hint: `No results for "${query}"` }) : results.length > 0 ? /* @__PURE__ */ jsx17(UserList, { users: results, onSelect: handleUserSelect }) : /* @__PURE__ */ jsx17(Empty, { message: "Search for users", hint: "Type a username and press Enter" })
  ] }) });
}

// src/screens/Settings.tsx
import { useState as useState8 } from "react";
import { Box as Box16, Text as Text13, useInput as useInput7 } from "ink";
import { jsx as jsx18, jsxs as jsxs16 } from "react/jsx-runtime";
var hints5 = [
  { key: "Enter", action: "confirm" },
  { key: "c", action: "clear identity" },
  { key: "Esc", action: "back" }
];
function Settings() {
  const { pop } = useNavigation();
  const { identity: identity2, loading, error, setIdentity, clearIdentity, refreshIdentity } = useIdentity();
  const [inputValue, setInputValue] = useState8("");
  const [isEditing, setIsEditing] = useState8(!identity2);
  const [localError, setLocalError] = useState8(null);
  const width = getContentWidth();
  useInput7((input, key) => {
    if (input === "c" && identity2 && !isEditing) {
      clearIdentity();
      setIsEditing(true);
      setInputValue("");
    }
    if (input === "r" && identity2 && !isEditing) {
      refreshIdentity();
    }
    if (key.return && isEditing && inputValue.length > 10) {
      handleSetIdentity();
    }
  });
  const handleSetIdentity = async () => {
    setLocalError(null);
    try {
      await setIdentity(inputValue.trim());
      setIsEditing(false);
      setInputValue("");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to set identity");
    }
  };
  return /* @__PURE__ */ jsx18(Screen, { title: "Settings", subtitle: "Identity", hints: hints5, children: /* @__PURE__ */ jsxs16(Box16, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsx18(Text13, { bold: true, children: "Identity Configuration" }),
    /* @__PURE__ */ jsx18(Text13, { children: horizontalLine(width - 2) }),
    loading ? /* @__PURE__ */ jsx18(Spinner, { label: "Verifying identity..." }) : identity2 ? (
      // Show current identity
      /* @__PURE__ */ jsxs16(Box16, { flexDirection: "column", marginTop: 1, children: [
        /* @__PURE__ */ jsxs16(Box16, { children: [
          /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Status: " }),
          /* @__PURE__ */ jsx18(Text13, { color: "green", children: "Connected" })
        ] }),
        /* @__PURE__ */ jsx18(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Identity ID:" }) }),
        /* @__PURE__ */ jsx18(Text13, { children: identity2.identityId }),
        identity2.username && /* @__PURE__ */ jsxs16(Box16, { marginTop: 1, children: [
          /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Username: " }),
          /* @__PURE__ */ jsx18(Text13, { children: styled.username(identity2.username) })
        ] }),
        identity2.balance !== void 0 && /* @__PURE__ */ jsxs16(Box16, { marginTop: 1, children: [
          /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Balance: " }),
          /* @__PURE__ */ jsx18(Text13, { children: formatCredits(identity2.balance) })
        ] }),
        /* @__PURE__ */ jsx18(Box16, { marginTop: 2, children: /* @__PURE__ */ jsxs16(Text13, { dimColor: true, children: [
          "Press ",
          /* @__PURE__ */ jsx18(Text13, { bold: true, children: "c" }),
          " to clear identity, ",
          /* @__PURE__ */ jsx18(Text13, { bold: true, children: "r" }),
          " to refresh"
        ] }) })
      ] })
    ) : (
      // Show input for identity
      /* @__PURE__ */ jsxs16(Box16, { flexDirection: "column", marginTop: 1, children: [
        /* @__PURE__ */ jsxs16(Box16, { children: [
          /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Status: " }),
          /* @__PURE__ */ jsx18(Text13, { color: "yellow", children: "Not connected" })
        ] }),
        /* @__PURE__ */ jsx18(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx18(Text13, { children: "Enter your Identity ID to view personalized content." }) }),
        /* @__PURE__ */ jsx18(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Your identity ID is a base58 string (e.g., 5DbLwAx...). This is read-only - no private key needed." }) }),
        /* @__PURE__ */ jsxs16(Box16, { marginTop: 2, children: [
          /* @__PURE__ */ jsx18(Text13, { color: "cyan", children: "Identity ID: " }),
          /* @__PURE__ */ jsx18(
            build_default,
            {
              value: inputValue,
              onChange: setInputValue,
              placeholder: "Enter your identity ID..."
            }
          )
        ] }),
        (localError || error) && /* @__PURE__ */ jsx18(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx18(Text13, { color: "red", children: localError || error }) }),
        /* @__PURE__ */ jsx18(Box16, { marginTop: 2, children: /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Press Enter to connect" }) })
      ] })
    ),
    /* @__PURE__ */ jsxs16(Box16, { marginTop: 3, flexDirection: "column", children: [
      /* @__PURE__ */ jsx18(Text13, { children: horizontalLine(width - 2) }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "About Identity Mode" }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "Setting your identity allows you to:" }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "  - See your following feed" }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "  - View your interactions (likes, reposts)" }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "  - See your profile and balance" }),
      /* @__PURE__ */ jsx18(Text13, { children: " " }),
      /* @__PURE__ */ jsx18(Text13, { dimColor: true, children: "This is read-only. No private key is stored or required." })
    ] })
  ] }) });
}

// src/screens/Followers.tsx
import { useInput as useInput8 } from "ink";

// src/hooks/useFollowers.ts
init_follow_service();
import { useState as useState9, useEffect as useEffect8, useCallback as useCallback5 } from "react";
function useFollowers(userId, mode) {
  const [users, setUsers] = useState9([]);
  const [loading, setLoading] = useState9(true);
  const [error, setError] = useState9(null);
  const fetchUsers = useCallback5(async () => {
    setLoading(true);
    setError(null);
    try {
      let documents;
      if (mode === "followers") {
        documents = await followService.getFollowers(userId, { limit: 100 });
      } else {
        documents = await followService.getFollowing(userId, { limit: 100 });
      }
      if (documents.length === 0) {
        setUsers([]);
        return;
      }
      const userIds = mode === "followers" ? documents.map((d) => d.$ownerId) : documents.map((d) => d.followingId);
      const profiles = await profileService.getProfilesByIdentityIds(userIds);
      const usernames = await dpnsService.resolveUsernamesBatch(userIds);
      const fetchedUsers = userIds.map((id) => {
        const profile = profiles.find((p) => p.$ownerId === id);
        const username = usernames.get(id);
        return {
          id,
          username: username || id.slice(0, 8),
          displayName: profile?.displayName || username || id.slice(0, 8),
          avatar: "",
          bio: profile?.bio,
          followers: 0,
          following: 0,
          joinedAt: /* @__PURE__ */ new Date()
        };
      });
      setUsers(fetchedUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);
  useEffect8(() => {
    fetchUsers();
  }, [fetchUsers]);
  return { users, loading, error, refresh: fetchUsers };
}

// src/screens/Followers.tsx
import { jsx as jsx19 } from "react/jsx-runtime";
var hints6 = [
  { key: "j/k", action: "navigate" },
  { key: "Enter", action: "view profile" },
  { key: "r", action: "refresh" },
  { key: "b", action: "back" }
];
function Followers({ userId, mode }) {
  const { push } = useNavigation();
  const { users, loading, error, refresh } = useFollowers(userId, mode);
  useInput8((input) => {
    if (input === "r")
      refresh();
  });
  const handleUserSelect = (user) => {
    push("user", { userId: user.id });
  };
  const title = mode === "followers" ? "Followers" : "Following";
  if (loading && users.length === 0) {
    return /* @__PURE__ */ jsx19(Screen, { title, hints: hints6, children: /* @__PURE__ */ jsx19(Spinner, { label: `Loading ${mode}...` }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx19(Screen, { title, hints: hints6, children: /* @__PURE__ */ jsx19(Error2, { message: error }) });
  }
  return /* @__PURE__ */ jsx19(Screen, { title, subtitle: `${users.length} users`, hints: hints6, children: /* @__PURE__ */ jsx19(UserList, { users, onSelect: handleUserSelect }) });
}

// src/screens/Hashtag.tsx
import { useState as useState10, useEffect as useEffect9, useCallback as useCallback6 } from "react";
import { useInput as useInput9 } from "ink";
import { jsx as jsx20 } from "react/jsx-runtime";
var hints7 = [
  { key: "j/k", action: "navigate" },
  { key: "Enter", action: "open post" },
  { key: "r", action: "refresh" },
  { key: "b", action: "back" }
];
function Hashtag({ tag }) {
  const { push } = useNavigation();
  const [posts, setPosts] = useState10([]);
  const [loading, setLoading] = useState10(true);
  const [error, setError] = useState10(null);
  const fetchPosts = useCallback6(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postService.getPostsByHashtag(tag, { limit: 50 });
      const enriched = await postService.enrichPostsBatch(result.documents);
      setPosts(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [tag]);
  useEffect9(() => {
    fetchPosts();
  }, [fetchPosts]);
  useInput9((input) => {
    if (input === "r")
      fetchPosts();
  });
  const handlePostSelect = (post) => {
    push("post", { postId: post.id });
  };
  if (loading && posts.length === 0) {
    return /* @__PURE__ */ jsx20(Screen, { title: `#${tag}`, hints: hints7, children: /* @__PURE__ */ jsx20(Spinner, { label: "Loading posts..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx20(Screen, { title: `#${tag}`, hints: hints7, children: /* @__PURE__ */ jsx20(Error2, { message: error }) });
  }
  return /* @__PURE__ */ jsx20(Screen, { title: `#${tag}`, subtitle: `${posts.length} posts`, hints: hints7, children: /* @__PURE__ */ jsx20(PostList, { posts, onSelect: handlePostSelect }) });
}

// src/screens/Help.tsx
import { Box as Box17, Text as Text14 } from "ink";
import { jsx as jsx21, jsxs as jsxs17 } from "react/jsx-runtime";
function Help() {
  const width = getContentWidth();
  const Section = ({ title, children }) => /* @__PURE__ */ jsxs17(Box17, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ jsx21(Text14, { bold: true, color: "cyan", children: title }),
    children
  ] });
  const Key = ({ k, action }) => /* @__PURE__ */ jsxs17(Box17, { children: [
    /* @__PURE__ */ jsx21(Box17, { width: 12, children: /* @__PURE__ */ jsx21(Text14, { bold: true, children: k }) }),
    /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: action })
  ] });
  return /* @__PURE__ */ jsx21(Screen, { title: "Help", subtitle: "Keyboard Shortcuts", hints: [{ key: "Esc", action: "close" }], children: /* @__PURE__ */ jsxs17(Box17, { flexDirection: "column", paddingX: 1, children: [
    /* @__PURE__ */ jsxs17(Section, { title: "Navigation", children: [
      /* @__PURE__ */ jsx21(Key, { k: "j / \\u2193", action: "Move down" }),
      /* @__PURE__ */ jsx21(Key, { k: "k / \\u2191", action: "Move up" }),
      /* @__PURE__ */ jsx21(Key, { k: "Enter", action: "Select / Open" }),
      /* @__PURE__ */ jsx21(Key, { k: "b / Esc", action: "Go back" }),
      /* @__PURE__ */ jsx21(Key, { k: "g", action: "Go to timeline" })
    ] }),
    /* @__PURE__ */ jsxs17(Section, { title: "Global", children: [
      /* @__PURE__ */ jsx21(Key, { k: "/", action: "Open search" }),
      /* @__PURE__ */ jsx21(Key, { k: "i", action: "Open settings (identity)" }),
      /* @__PURE__ */ jsx21(Key, { k: "?", action: "Show this help" }),
      /* @__PURE__ */ jsx21(Key, { k: "q", action: "Quit" }),
      /* @__PURE__ */ jsx21(Key, { k: "r", action: "Refresh current view" })
    ] }),
    /* @__PURE__ */ jsxs17(Section, { title: "Timeline", children: [
      /* @__PURE__ */ jsx21(Key, { k: "1", action: "Global feed" }),
      /* @__PURE__ */ jsx21(Key, { k: "2", action: "Following feed (requires identity)" })
    ] }),
    /* @__PURE__ */ jsxs17(Section, { title: "Profile", children: [
      /* @__PURE__ */ jsx21(Key, { k: "1", action: "User's posts" }),
      /* @__PURE__ */ jsx21(Key, { k: "2", action: "User's likes" }),
      /* @__PURE__ */ jsx21(Key, { k: "f", action: "View followers" }),
      /* @__PURE__ */ jsx21(Key, { k: "g", action: "View following" })
    ] }),
    /* @__PURE__ */ jsx21(Section, { title: "Post Detail", children: /* @__PURE__ */ jsx21(Key, { k: "a", action: "View author profile" }) }),
    /* @__PURE__ */ jsx21(Text14, { children: horizontalLine(width - 2) }),
    /* @__PURE__ */ jsxs17(Box17, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx21(Text14, { bold: true, children: "About Yappr CLI" }),
      /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: "A read-only terminal interface for Yappr, the decentralized" }),
      /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: "social media platform on Dash Platform." }),
      /* @__PURE__ */ jsx21(Text14, { children: " " }),
      /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: "Set your identity (press i) to see personalized content like" }),
      /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: "your following feed and interaction status." }),
      /* @__PURE__ */ jsx21(Text14, { children: " " }),
      /* @__PURE__ */ jsx21(Text14, { dimColor: true, children: "Version 0.1.0" })
    ] })
  ] }) });
}

// src/app.tsx
import { jsx as jsx22 } from "react/jsx-runtime";
function App({ initialScreen, initialParams }) {
  const { exit } = useApp();
  const { current, push, pop, reset } = useNavigation();
  const { loadIdentity } = useIdentity();
  useEffect10(() => {
    loadIdentity();
  }, []);
  useEffect10(() => {
    if (initialScreen) {
      reset(initialScreen, initialParams);
    }
  }, [initialScreen]);
  useInput10((input, key) => {
    if (input === "q" && current.screen !== "search" && current.screen !== "settings") {
      exit();
      return;
    }
    if (input === "?" && current.screen !== "help") {
      push("help");
      return;
    }
    if (key.escape || input === "b" && current.screen !== "search") {
      if (current.screen === "help") {
        pop();
      } else if (!pop()) {
        exit();
      }
      return;
    }
    if (input === "g" && current.screen !== "search" && current.screen !== "settings") {
      reset("timeline");
      return;
    }
    if (input === "/" && current.screen !== "search") {
      push("search");
      return;
    }
    if (input === "i" && current.screen !== "settings") {
      push("settings");
      return;
    }
  });
  const renderScreen = () => {
    switch (current.screen) {
      case "timeline":
        return /* @__PURE__ */ jsx22(Timeline, { ...current.params });
      case "post":
        return /* @__PURE__ */ jsx22(PostDetail, { postId: current.params.postId });
      case "user":
        return /* @__PURE__ */ jsx22(UserProfile, { userId: current.params.userId, username: current.params.username });
      case "search":
        return /* @__PURE__ */ jsx22(Search, { initialQuery: current.params.query });
      case "settings":
        return /* @__PURE__ */ jsx22(Settings, {});
      case "followers":
        return /* @__PURE__ */ jsx22(Followers, { userId: current.params.userId, mode: current.params.mode });
      case "hashtag":
        return /* @__PURE__ */ jsx22(Hashtag, { tag: current.params.tag });
      case "help":
        return /* @__PURE__ */ jsx22(Help, {});
      default:
        return /* @__PURE__ */ jsx22(Timeline, {});
    }
  };
  return /* @__PURE__ */ jsx22(Box18, { flexDirection: "column", width: "100%", children: renderScreen() });
}

// src/index.tsx
import { jsx as jsx23 } from "react/jsx-runtime";
async function main() {
  const args = process.argv.slice(2);
  let initialScreen = "timeline";
  let initialParams = {};
  if (args.length > 0) {
    const command = args[0];
    switch (command) {
      case "timeline":
      case "feed":
        initialScreen = "timeline";
        break;
      case "user":
      case "profile":
        if (args[1]) {
          initialScreen = "user";
          if (args[1].startsWith("@")) {
            initialParams = { username: args[1].slice(1) };
          } else {
            initialParams = { username: args[1] };
          }
        }
        break;
      case "post":
        if (args[1]) {
          initialScreen = "post";
          initialParams = { postId: args[1] };
        }
        break;
      case "search":
        initialScreen = "search";
        if (args[1]) {
          initialParams = { query: args.slice(1).join(" ") };
        }
        break;
      case "hashtag":
      case "tag":
        if (args[1]) {
          initialScreen = "hashtag";
          initialParams = { tag: args[1].replace(/^#/, "") };
        }
        break;
      case "settings":
      case "config":
        initialScreen = "settings";
        break;
      case "help":
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      case "version":
      case "--version":
      case "-v":
        console.log("yappr-cli v0.1.0");
        process.exit(0);
        break;
      default:
        if (command.startsWith("@")) {
          initialScreen = "user";
          initialParams = { username: command.slice(1) };
        }
        break;
    }
  }
  try {
    await cliSdkService.initialize({ quiet: false });
    console.clear();
    const { waitUntilExit } = render(
      /* @__PURE__ */ jsx23(App, { initialScreen, initialParams })
    );
    await waitUntilExit();
  } catch (error) {
    console.error("Failed to start:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
function printHelp() {
  console.log(`
yappr-cli - Interactive CLI for Yappr

USAGE:
  yappr-cli [command] [args]

COMMANDS:
  timeline, feed     View the global timeline (default)
  user <username>    View a user's profile
  post <postId>      View a specific post
  search [query]     Search for users
  hashtag <tag>      View posts with hashtag
  settings           Configure identity
  help               Show this help message

EXAMPLES:
  yappr-cli                    # Open timeline
  yappr-cli @alice             # View alice's profile
  yappr-cli user alice         # Same as above
  yappr-cli search bob         # Search for users named bob
  yappr-cli hashtag dash       # View posts with #dash

KEYBOARD SHORTCUTS:
  j/k, arrows  Navigate up/down
  Enter        Select/open
  b, Esc       Go back
  g            Go to timeline
  /            Open search
  i            Open settings
  r            Refresh
  ?            Show help
  q            Quit
`);
}
main();
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.production.js:
  (**
   * @license React
   * use-sync-external-store-shim.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
