/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.settings.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";
    
    Waves.server = Waves.constants.NODE_ADDRESS; //Enter your node or localhost here.
    Waves.epoch = 1460678400;
    Waves.seed = '';
    Waves.hasLocalStorage = _checkDOMenabled();
    Waves.stateInterval;
    Waves.stateIntervalSeconds = 25;

    //possible networks: testnet, devel = testnet
    //You can using anything for Waves.network which will create a new account storage on mainnet
    Waves.network = Waves.constants.NETWORK_NAME;

	return Waves;
}(Waves || {}, jQuery));

function _checkDOMenabled() {
    var storage;
    var fail;
    var uid;
    try {
        uid = String(new Date());
        (storage = window.localStorage).setItem(uid, uid);
        fail = storage.getItem(uid) != uid;
        storage.removeItem(uid);
        fail && (storage = false);
    } catch (exception) {
    }
    return storage;
}