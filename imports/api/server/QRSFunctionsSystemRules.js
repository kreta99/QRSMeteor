import { Meteor } from 'meteor/meteor';
// import { APILogs } from '/imports/api/APILogs';

import {
    qrs
} from '/imports/api/config.js';
import * as QSLic from '/imports/api/server/QRSFunctionsLicense';

export function getSecurityRules(name) {
    return QSLic.getSystemRules(name);
}

export function disableDefaultSecurityRules() {
    Meteor.settings.security.rulesToDisable.forEach(function(rule) {
        console.log('rule', rule)

        QSLic.getSystemRules(rule.name);
        //var response = qrs.post('/qrs/SystemRule', rule);
    });
}

export function createSecurityRules() {
    console.log('createSecurityRules');
    var securityRules = [{
            "category": "Security",
            "type": "Custom",
            "name": "Z_SLIDE_GENERATOR",
            "rule": "resource.name=\"API apps\" and ( user.environment.group=\"TECHNICAL\" or user.environment.group=\"GENERIC\" )",
            "resourceFilter": "Stream_*",
            "actions": 2,
            "comment": "",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_Root_ALL",
            "rule": "((user.roles=\"RootAdmin\"))",
            "resourceFilter": "*",
            "actions": 511,
            "comment": "Root: Hub and QMC full access",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_OEM_STREAM_ACCESS",
            "rule": "((resource.name=user.environment.group or (resource.name=\"Everyone\") ))",
            "resourceFilter": "Stream_*",
            "actions": 2,
            "comment": "",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_QMC_ADMINS_CUSTOMER2",
            "rule": "user.environment.group = \"Admin\" \nand \n( \nresource.HasPrivilege(\"read\") \nor\n resource.app.HasPrivilege(\"read\")\nand\nresource.stream.name != \"Everyone\"\n )",
            "resourceFilter": "App_*",
            "actions": 300,
            "comment": "Administrators are only allowed to maintain the apps and app.object in the QMC",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_QMC_ADMINS_CUSTOMER",
            "rule": "((user.environment.group=\"Admin\"))",
            "resourceFilter": "QmcSection_Stream, QmcSection_App*",
            "actions": 2,
            "comment": "QMC Menu only. Only give access to stream if the name of the stream match the AD group. Note, we disabled the default Stream Rule",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_AUDITOR",
            "rule": "user.environment.group=\"GLOBAL AUDITOR\"",
            "resourceFilter": "*",
            "actions": 2,
            "comment": "display all for auditors",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_OEM_APP_ACCESS (CONSUMER)",
            "rule": "resource.stream.HasPrivilege(\"read\") or (resource.resourcetype = \"App.Object\" and resource.published =\"true\" and resource.app.HasPrivilege(\"read\"))",
            "resourceFilter": "App*",
            "actions": 2,
            "comment": "The basis rule on which all others depend. Provide access to an app if you already have access to the stream.",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_CONTRIBUTOR",
            "rule": "user.environment.group=\"Contributor\" and  \nresource.app.HasPrivilege(\"read\")\nand resource.published =\"false\"",
            "resourceFilter": "App*",
            "actions": 37,
            "comment": "Extends the Z_OEM_APP_ACCESS (CONSUMER) rule. This user can also create own sheets in predefined apps. He can't create apps, only a developer can do this.",
            "disabled": false,
            "privileges": null
        },
        {
            "category": "Security",
            "type": "Custom",
            "name": "Z_OEM_DEVELOPER",
            "rule": "user.environment.group = \"Developer\" and\n ((resource.owner = user and resource.stream.Empty()) or (resource.app.HasPrivilege(\"read\") and resource.published =\"false\" ))",
            "resourceFilter": "App*",
            "actions": 317,
            "comment": "Extends the Z_OEM_APP_ACCESS (CONSUMER) rule. This user can also create own apps and create sheets in apps (like a contributor). He can't publish.",
            "disabled": false,
            "privileges": null
        }
    ];

    securityRules.forEach(function(rule) {
        var response = qrs.post('/qrs/SystemRule', rule);
    });

}

function stringToJSON(myString) {
    var myJSONString = JSON.stringify(myString);
    var myEscapedJSONString = myJSONString.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");

    console.log('myEscapedJSONString', myEscapedJSONString)
}