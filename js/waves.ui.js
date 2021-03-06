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
 * @depends {3rdparty/jquery-validate.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/jquery.growl.js}
 * @depends {3rdparty/clipboard.js}
 * @depends {axlsign/axlsign.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.js}
 * @depends {waves.api.address.js}
 */
var Waves = (function(Waves, $, undefined) {
    "use strict";

    Waves.balance = new Money(0, Currency.WAV);
    Waves.hasLocalStorage = false;
    Waves.update;
    Waves.blockUpdate;
    Waves.blockHeight;

    var buildHistoryTableRow = function(transaction, unconfirmed) {
        var unconfirmedClass = unconfirmed ? "wavesTable-txUnc " : "";
        var senderClass = 'class="' + unconfirmedClass + 'wavesTable-txIn"';
        var paymentType = 'Incoming ';
        var you = 'You';
        if(transaction.sender === Waves.address.getRawAddress()) {

            senderClass = 'class="' + unconfirmedClass + 'wavesTable-txOut"';
            paymentType = 'Outgoing ';
        }

        var sender = transaction.sender !== undefined ?
            Waves.Addressing.fromRawAddress(transaction.sender).getDisplayAddress() :
            "none";

        var recipient;
        if(transaction.sender === Waves.address.getRawAddress()) {
            sender = you;
        } else {
            sender = '<span class="clipSpan tooltip-1" title="Copy this address to the clipboard." data-clipboard-text="' + sender + '">' + sender + '</span>';
        }

        if(transaction.recipient === Waves.address.getRawAddress()) {
            recipient = you;
        } else {
            recipient = '<span class="clipSpan tooltip-1" title="Copy this address to the clipboard." data-clipboard-text="' + Waves.Addressing.fromRawAddress(transaction.recipient).getDisplayAddress() + '">'+
                Waves.Addressing.fromRawAddress(transaction.recipient).getDisplayAddress()+'</span>';
        }

        if (sender === recipient)
            paymentType = 'Self ';

        var amount = Money.fromCoins(transaction.amount, Currency.WAV);
        var fee = Money.fromCoins(transaction.fee, Currency.WAV);

        var result = '<tr '+senderClass+'>';
        result += '<td>'+Waves.formatTimestamp(transaction.timestamp)+'</td>';
        result += '<td>' +paymentType + Waves.transactionType(transaction.type)+'</td>';
        result += '<td>'+ sender +'</td>';
        result += '<td>'+ recipient +'</td>';
        result += '<td>'+ fee.formatAmount(true) +' WAVE</td>';
        result += '<td>'+ amount.formatAmount() +' WAVE</td>';
        result += '</tr>';

        return result;
    };

    Waves.UI.updateWavesBalance = function (balance) {
        var currentBalance = Money.fromCoins(balance, Currency.WAV);
        $("#wavesCurrentBalance").val(currentBalance.formatAmount());
        $("#wavesbalance").html(currentBalance.formatIntegerPart());
        $("#wavesbalancedec").html(currentBalance.formatFractionPart());
        $("#balancespan").html(currentBalance.formatAmount() +' Waves');
        $('.balancewaves').html(currentBalance.formatAmount() + ' Waves');
    }

    //These are the functions running every Waves.stateIntervalSeconds for each page.
    Waves.pages = {
        'mBB-wallet': function updateWallet () {

            Waves.loadAddressBalance(Waves.address, function (balance) {
                Waves.UI.updateWavesBalance(balance);

                Waves.apiRequest(Waves.api.transactions.unconfirmed, function(unconfirmedTransactions) {

                    Waves.getAddressHistory(Waves.address, function(history) {

                        var transactionHistory = history[0];
                        var appContainer;

                        transactionHistory.sort(function(x, y){
                            return y.timestamp - x.timestamp;
                        });

                        var max = 10;
                        var signatureKeys = []; //Prevent double-entry with unconfirmed transactions

                        if(unconfirmedTransactions.length > 0) {

                            $.each(unconfirmedTransactions, function(keyunc, dataunc) {

                                if(dataunc.sender === Waves.address.getRawAddress() || dataunc.recipient === Waves.address.getRawAddress()) {

                                    if(max > 0) {
                                        signatureKeys.push(dataunc.signature);

                                        appContainer += buildHistoryTableRow(dataunc, true);
                                    }
                                    max--;
                                }
                            });
                        }

                        $.each(transactionHistory, function(historyKey, historyValue) {
                            
                            if(max > 0) {
                                if (signatureKeys.indexOf(historyValue.signature) === -1) {
                                    appContainer += buildHistoryTableRow(historyValue, false);
                                }
                            }
                            max--;
                        });

                        $("#walletTransactionhistory").html(appContainer);
                    });

                });

            });
        },
        'mBB-portfolio': function updatePortfolio () {
            //Auto Updating Portfolio Page Items
        },
        'mBB-exchange': function updateExchange() {
            //Auto Updating Exchange Page Items
        },
        'mBB-voting' : function updateVoting() {
            //Auto Updating Voting Page Items
        },
        'mBB-history': function updateHistory() {

            Waves.apiRequest(Waves.api.transactions.unconfirmed, function(unconfirmedTransactions) {
            
                Waves.getAddressHistory(Waves.address, function(history) {
                    var transactionHistory = history[0];
                    var appContainer = '';

                    var signatureKeys = []; //Prevent double-entry with unconfirmed transactions

                    if(unconfirmedTransactions.length > 0) {

                        $.each(unconfirmedTransactions, function(keyunc, dataunc) {
                            if(dataunc.sender === Waves.address.getRawAddress() || dataunc.recipient === Waves.address.getRawAddress()) {
                                signatureKeys.push(dataunc.signature);

                                appContainer += buildHistoryTableRow(dataunc, true);
                            }
                        });
                    }
                    
                    transactionHistory.sort(function(x, y){
                        return y.timestamp - x.timestamp;
                    });

                    $.each(transactionHistory, function(historyKey, historyValue) {
                        if (signatureKeys.indexOf(historyValue.signature) === -1) {
                            appContainer += buildHistoryTableRow(historyValue, false);
                        }
                    });

                    $("#transactionhistory").html(appContainer);
                });
            });

        },
        'mBB-messages': function updateMessages () {
            //Auto Updating Messages Page Items
        },
        'mBB-community': function updateCommunity () {

            var amountOfBlocks = 100;
            var row = '';
            var endBlock = Waves.blockHeight;
            var startBlock = endBlock - amountOfBlocks;
            if(startBlock <= 0) startBlock = 1;
            Waves.apiRequest(Waves.api.blocks.lastBlocks(startBlock, endBlock), function(response) {

                response.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                });

                $.each(response, function(blockKey, blockData) {

                    var generator = '<span class="clipSpan tooltip-1" title="Copy this address to the clipboard." data-clipboard-text="' + Waves.Addressing.fromRawAddress(blockData.generator).getDisplayAddress() + '">'+Waves.Addressing.fromRawAddress(blockData.generator).getDisplayAddress()+'</span>'; 

                    row += '<tr class="fade">'+
                        '<td>'+blockData.height+'</td>'+
                        '<td>'+Waves.formatTimestamp(blockData.timestamp)+'</td>'+
                        '<td>'+blockData.transactions.length+'</td>'+
                        '<td>'+generator+'</td>'+
                    '</tr>';

                });

                $("#latestBlocksTable").html(row);

            });

            Waves.apiRequest(Waves.api.transactions.unconfirmed, function(response) {

                response.sort(function(x, y){
                    return y.timestamp - x.timestamp;
                });

                var futureBlock = Waves.blockHeight + 1; 
                var unconfirmedRow = '<tr class="fade">'+
                        '<td>'+futureBlock+'</td>'+
                        '<td><i>incoming</i></td>'+
                        '<td>'+response.length+'</td>'+
                        '<td><i>unconfirmed</i></td>'+
                    '</tr>';

                $("#latestBlocksUnconfirmed").html(unconfirmedRow);

            });

        }
    };

    Waves.updatePage = function ( page ) {
        clearInterval(Waves.update);
        Waves.updateDOM(page);
    };

    Waves.updateDOM = function (page) {

        var interval = Waves.stateIntervalSeconds * 1000;
        if (Waves.pages[page]) {
            Waves.pages[page]();
            Waves.update = setInterval(function() {

            //Updating page functions
             Waves.pages[page]();

             //Load Blocks regularly
             Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
                Waves.blockHeight = result.height;
                $("#blockheight").html(result.height);

            }); 

         }, interval);
        }
    };

    // Show/hide different sections on tab activation
    // The ROUTING
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        clearInterval(Waves.update);
        Waves.updateDOM($(this).val());

        switch(linkType) {
            case 'mBB-portfolio':

            break;
            case 'mBB-history':

                $("#transactionHistorySearch").on("click", function() {
                    Waves.updatePage('mBB-history');
                }); 

            break;
        }
    });


    $("#addContact").on("click", function(e) {
        e.preventDefault();

        $("#contactForm").toggle();
    });

    $("#addContactSubmit").on("click", function(e) {
        e.preventDefault();

        var name = $("#contactname").val();
        var address = $("#contactaddress").val();
        var email = $("#contactemail").val();

        var accountData = {
            name: name,
            address: address,
            email: email
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesContacts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.contacts.push(accountData);
                localStorage.setItem('WavesContacts', JSON.stringify(currentAccounts));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);

            } else {

                var accountArray = { contacts: [accountData] };
                localStorage.setItem('WavesContacts', JSON.stringify(accountArray));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);
            }

        }

    });

    $("#tabs-Icons-community").on("click", function(e) {

        var currentAccounts = localStorage.getItem('WavesContacts');
            currentAccounts = JSON.parse(currentAccounts);

        var row;
        $.each(currentAccounts.contacts, function(contactKey, contactData) {
            
            row += Waves.contactRow(contactData);
    
        });

        $("#contactTable").html(row);

    });
    
    $('#header-wPop-backup').on($.modal.BEFORE_OPEN, function() {
        $('#seedBackup').val(Waves.passphrase);
        $('#encodedSeedBackup').val(Base58.encode(converters.stringToByteArray(Waves.passphrase)));
        $('#privateKeyBackup').val(Waves.privateKey);
        $('#publicKeyBackup').val(Waves.publicKey);
        $("#addressBackup").val(Waves.buildAddress(Waves.publicKey).getDisplayAddress());
    });

    $('#header-wPop-backup').on($.modal.AFTER_CLOSE, function() {
        $('#seedBackup').val('');
        $('#encodedSeedBackup').val('');
        $('#privateKeyBackup').val('');
        $('#publicKeyBackup').val('');
        $("#addressBackup").val('');
    });

    $('#wB-butSend-WAV').on($.modal.BEFORE_OPEN, function () {
        // set default value for the transaction fee
        var feeText = $("#wavessendfee").val().replace(/\s+/g, '');
        if (feeText.length === 0)
            $("#wavessendfee").val(Waves.UI.constants.MINIMUM_TRANSACTION_FEE);
    });

    $(function() {
        $.widget("custom.combobox", {
            _create: function() {
                this.wrapper = $("<span>")
                    .addClass("custom-combobox")
                    .insertAfter(this.element);

                this.element.hide();
                this._createAutocomplete();
                this._createShowAllButton();
            },

            _createAutocomplete: function() {
                var selected = this.element.children( ":selected" ),
                    value = selected.val() || "";

                this.input = $("<input>")
                    .appendTo(this.wrapper)
                    .val(value)
                    .attr("title", "")
                    .addClass("custom-combobox-input " +
                        "ui-widget ui-widget-content ui-state-default ui-corner-left")
                    .autocomplete({
                        delay: 0,
                        minLength: 0,
                        source: $.proxy(this, "_source"),
                        appendTo: '#wB-butSend-WAV'
                    });

                this._on(this.input, {
                    autocompleteselect: function(event, ui) {
                        ui.item.option.selected = true;
                        this._trigger( "select", event, {
                            item: ui.item.option
                        });
                    },
                });
            },

            _createShowAllButton: function() {
                var input = this.input,
                    wasOpen = false;

                $("<a>")
                    .attr("tabIndex", -1)
                    .attr("title", "Show All Items")
                    .appendTo(this.wrapper)
                    .button({
                        icons: {
                            primary: "ui-icon-triangle-1-s"
                        },
                        text: false
                    })
                    .removeClass("ui-corner-all")
                    .addClass("custom-combobox-toggle ui-corner-right")
                    .on("mousedown", function() {
                        wasOpen = input.autocomplete("widget").is(":visible");
                    })
                    .on("click", function() {
                        input.trigger("focus");

                        // Close if already visible
                        if (wasOpen) {
                            return;
                        }

                        // Pass empty string as value to search for, displaying all results
                        input.autocomplete("search", "");
                    });
            },

            _source: function(request, response) {
                var term = request.term.trim().toLowerCase();
                response(this.element.children("option").map(function() {
                    var text = $(this).text();
                    var value = $(this).val();
                    if (!term || text.trim().toLowerCase().startsWith(term))
                        return {
                            label: text,
                            value: value,
                            option: this
                        };
                }));
            },

            _destroy: function() {
                this.wrapper.remove();
                this.element.show();
            }
        });

        $('#wavessendfee').combobox();
    });

    $('#copy_and_close_backup_modal').click(function (e) {
        e.preventDefault();

        //copy to clipboard
        var text = "Seed: " + $('#seedBackup').val() + "\n";
        text += "Encoded seed: " + $('#encodedSeedBackup').val() + "\n";
        text += "Private key: " + $('#privateKeyBackup').val() + "\n";
        text += "Public key: " + $('#publicKeyBackup').val() + "\n";
        text += "Address: " + $('#addressBackup').val();
        var clipboard = new Clipboard('#copy_and_close_backup_modal', {
            text : function(trigger) {
                return text;
            }
        });
        clipboard.on('success', function(e) {
            $.growl.notice({ message: "Account backup has been copied to clipboard" });

            e.clearSelection();
        });

        $.modal.close();
    })

    $('#uiTB-iconset-logout').click(function() {
        Waves.logout();  
    });

    //Add Copy-to-Clipboard to class clipSpan
    var clipboard = new Clipboard('.clipSpan');

    clipboard.on('success', function(e) {

        var message = $(e.trigger).attr("data-clipboard-message-success");
        if (message === undefined)
            message = "Address successfully copied to clipboard";
      
        $.growl.notice({ message: message });

        e.clearSelection();
    });

    clipboard.on('error', function(e) {
         $.growl.warning({ message: "Could not copy address to clipboard" });
    });

    // setting up jquery validation engine
    $.validator.setDefaults({
        debug: false,
        onkeyup: false,
        showErrors : function(errorMap, errorList) {
            errorList.forEach(function(error) {
                $.growl.error({ message : error.message, size: 'large' });
            });

            var i, elements;
            for (i = 0, elements = this.validElements(); elements[i]; i++) {
                $(elements[i]).removeClass(this.settings.errorClass);
            }

            for (i = 0, elements = this.invalidElements(); elements[i]; i++) {
                $(elements[i]).addClass(this.settings.errorClass);
            }
        }
    });
    $.validator.addMethod('address', function(value, element){
        return this.optional(element) || Waves.Addressing.validateDisplayAddress(value);
    }, "Account number must be a sequence of 35 alphanumeric characters with no spaces, optionally starting with '1W'");
    $.validator.addMethod('decimal', function(value, element, params) {
        var maxdigits = $.isNumeric(params) ? params : Waves.UI.constants.AMOUNT_DECIMAL_PLACES;

        var regex = new RegExp("^(?:-?\\d+)?(?:\\.\\d{1," + maxdigits + "})?$");
        return this.optional(element) || regex.test(value);
    }, "Amount is expected with a dot (.) as a decimal separator with no more than {0} fraction digits");
    $.validator.addMethod('password', function(value, element){
        if (this.optional(element))
            return true;

        var containsDigits = /[0-9]/.test(value);
        var containsUppercase = /[A-Z]/.test(value);
        var containsLowercase = /[a-z]/.test(value);

        return containsDigits && containsUppercase && containsLowercase;
    }, "The password is too weak. A good password must contain at least one digit, one uppercase and one lowercase letter");

    //How to growl:
    /*
      $.growl({ title: "Growl", message: "The kitten is awake!", url: "/kittens" });
      $.growl.error({ message: "The kitten is attacking!" });
      $.growl.notice({ message: "The kitten is cute!" });
      $.growl.warning({ message: "The kitten is ugly!" });
  */

    return Waves;
}(Waves || {}, jQuery));


$(document).ready(function(){

    Waves.initApp();

    $('.tooltip').tooltipster();

    $('.tooltip-1').tooltipster({
        theme: 'tooltipster-theme1',
        delay: 1000,
        contentAsHTML: true
    });
    
    $('.tooltip-2').tooltipster({
        theme: 'tooltipster-theme2',
        delay: 1000
    });
    
    $('.tooltip-3').tooltipster({
        theme: 'tooltipster-theme3',
        delay: 1000,
        contentAsHTML: true
    });

});