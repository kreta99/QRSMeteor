import {
    senseConfig,
    authHeaders
} from '/imports/api/config.js';
console.log('senseConfig', senseConfig)
import {
    REST_Log
} from '/imports/api/APILogs';
var showdown = require('showdown');
var Cookies = require('js-cookie');
const enigma = require('enigma.js');
const qixschema = senseConfig.QIXSchema;
var server = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + senseConfig.virtualProxySlideGenerator;
var appId = 'Not Yet initialized via main.js method call';
var slideObjectURL = 'Not Yet initialized via main.js method call';
var IntegrationPresentationSelectionSheet = Meteor.settings.public.slideGenerator.selectionSheet; //'DYTpxv'; selection sheet of the slide generator
var slideObject = Meteor.settings.public.slideGenerator.dataObject;
var intervalId = {};


Template.landingPage.onCreated(function() {
    appId = senseConfig.slideGeneratorAppId;
    slideObjectURL = server + '/single/?appid=' + appId + '&obj=' + Meteor.settings.public.slideGenerator.slideObject;

    //set a var so the sso ticket request page knows he has to login the real user and not some dummy user of step 4
    //after the user is redirected to the sso page, we put this var to false. in that way we can still request dummy users for step 4 of the demo
    // Session.setAuth('loginUserForPresentation', true);
    Session.setAuth('groupForPresentation', null);
    Session.setAuth('userLoggedInSense', null);
    Cookies.set('showSlideSorter', 'false');
    // Cookies.set('authenticatedSlideGenerator', 'false');
    console.log('first logout the current presentation user in Qlik Sense. After the logout, we try to open the Iframe URL, and request a new ticket with a new group: generic or technical, using section access we restrict the slides...');
    Meteor.call('logoutPresentationUser', Meteor.userId(), Meteor.userId()); //udc and user are the same for presentation users
    // logoutCurrentSenseUserClientSide();
    // intervalId = Meteor.setInterval(userLoggedInSense, 1000);
    // console.log('Qlik Sense presentation session cookie:', Cookies.get('X-Qlik-Session-presentationsso'));
    // console.log('All cookies available for Javascript:');
    // console.log(listCookies());
})

function listCookies() {
    var theCookies = document.cookie.split(';');
    var aString = '';
    for (var i = 1; i <= theCookies.length; i++) {
        aString += i + ' ' + theCookies[i - 1] + "\n";
    }
    return aString;
}
Template.presentationDimmer.onRendered(function() {
    Template.instance().$('.dimmer')
        .dimmer('show')
})
Template.landingPage.onRendered(function() {
    //show a popup so the user can select whether he is technical or not...
    this.$('#userSelectPresentationModal')
        .modal({
            // observeChanges: true,
            onDeny: function() {
                console.log('group has been set to TECHNICAL, we use this group to request a ticket in Qlik Sense. Using Section access we limit what a user can see. Now the iframe can be shown which tries to open the presentation virtual proxy');
                Session.setAuth('groupForPresentation', 'TECHNICAL');
                requestSenseTicket('TECHNICAL');
            },
            onApprove: function() {
                Session.setAuth('groupForPresentation', 'GENERIC');
                requestSenseTicket('GENERIC');
                console.log('group has been set to GENERIC. This group is used in the ticket to limit section access (Rows)');
            }
        })
        .modal('show')
        .css({
            position: "fixed",
            top: '35%',
            height: 350 //fix issue with modal being to high. Firefox needed 350.
        });

    Session.set('landingPageAlreadySeen', true);
})

async function requestSenseTicket(group) {
    // console.log('Slide generator landing page: checking Qlik Sense access... is the user logged in using the QPS API OnAuthenticationInformation?');
    var userProperties = {
        group: group
    };

    var ticket = await Meteor.callPromise('getTicketNumber', userProperties);
    console.log('Requested ticket from Qlik Sense server, so client can login without redirects...', ticket)

    const enigmaConfig = {
        schema: qixschema,
        // appId: appId,
        session: { //https://github.com/qlik-oss/enigma.js/blob/master/docs/qix/configuration.md#example-using-nodejs
            host: senseConfig.host,
            prefix: Meteor.settings.public.slideGenerator.virtualProxy,
            port: senseConfig.port,
            unsecure: true,
            urlParams: {
                qlikTicket: ticket
            }
        },
        listeners: {
            'notification:*': (event, data) => console.log('Engima: event ' + event, 'Engima: data ' + data),
        },
        handleLog: (message) => console.log('Engima: ' + message),
        //http://help.qlik.com/en-US/sense-developer/June2017/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-Msgs-Proxy-Clients-OnAuthenticationInformation.htm
        // listeners: {
        //     'notification:OnAuthenticationInformation': (authInfo) => {
        //         // console.log('authInfo', authInfo)
        //         if (authInfo.mustAuthenticate) {
        //             location.href = authInfo.loginUri;
        //         }
        //     },
        // }
    };

    console.log('We connect to Qlik Sense using enigma config', enigmaConfig)

    enigma.getService('qix', enigmaConfig)
        .then(qix => {
            console.log('user is authenticated in Qlik Sense. QIX object:', qix);
            Session.set('userLoggedInSense', true);
            logoutCurrentSenseUserClientSide();

        }).catch((error) => {
            console.info('info: No QIX connection for user, user not yet able to connect to the app via the enigma.js: ', error);
        });

}


// async function getQlikSession(userProperties) {
//     checkEnigmaConnection(userProperties);
//     // try {
//     //     var ticket = await Meteor.callPromise('getTicketNumber', userProperties);

//     //     const request = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy + '/resources/favicon.ico?qlikTicket=' + ticket;

//     //     console.log('client received ticket from server, which we append the our first http get request: ', request);

//     //     HTTP.call('GET', request, (error, result) => {
//     //         if (error) {
//     //             console.log('error', error)
//     //             sAlert.error('Failed to GET the user via the personal API (and get a session)', error);
//     //         }
//     //         console.log('------------------------------------');
//     //         console.log('received http get result: ', result);
//     //         console.log('------------------------------------');
//     //         sAlert.success('Get session by making an HTTP GET first: ' + request);
//     //         console.log('------------------------------------');
//     //         Session.set('userLoggedInSense', true);
//     //         // checkEnigmaConnection();
//     //     });
//     // } catch (err) {
//     //     console.error(err);
//     // }
// }

Template.landingPage.onDestroyed(function() {
    Meteor.clearInterval(intervalId);
})

Template.landingPage.helpers({
    userLoggedInSense: function() {
        return Session.get('userLoggedInSense');
    },
    userSelectedGroup: function() {
        return Session.get('groupForPresentation');
    }
})

Template.landingPage.events({
    'click #slideSorter': function(event) {
        Cookies.set('showSlideSorter', 'true');
        window.open("/slideSorter"); //GO TO THE SLIDE Sorter in a new tab
        // Router.go('slideSorter'); 
    }
})
Template.slideGeneratorSelectionScreen.onRendered(function() {
    this.$('.screen')
        .transition({
            animation: 'fade in',
            duration: '5s',
        });
})


export function logoutCurrentSenseUserClientSide() {
    // delete_cookie('X-Qlik-Session-presentation','', Meteor.settings.public.host);
    //http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm
    try {
        const call = {};
        const RESTCALL = 'http://' + senseConfig.host + ':' + senseConfig.port + '/' + Meteor.settings.public.slideGenerator.virtualProxy + '/qps/user';
        $.ajax({
            method: 'DELETE',
            url: RESTCALL
        }).done(function(res) {
            //logging only
            call.action = 'Logout current Qlik Sense user'; //
            call.request = RESTCALL;
            call.url = 'http://help.qlik.com/en-US/sense-developer/3.2/Subsystems/ProxyServiceAPI/Content/ProxyServiceAPI/ProxyServiceAPI-ProxyServiceAPI-Personal-Delete.htm';
            call.response = res;
            REST_Log(call, Meteor.userId());
        });
    } catch (err) {
        console.error(err);
        sAlert.Error('Failed to logout the user via the personal API', err.message);
    }
}

Template.selectSlide.onRendered(function() {
    this.$('.ui.accordion')
        .accordion();
})
Template.selectSlide.helpers({
    slideObjectURL: function() {
        return slideObjectURL;
    }
})