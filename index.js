const axios = require('axios')
const database = require('./database')
const authorization = require('./oauth')
const subtipos = require('./subtipos.json')

let con = null
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

const handler = async (event, context) => {

  context.callbackWaitsForEmptyEventLoop = false;
  var eventBody = typeof event == "string" ? JSON.parse(event) : event;

  if (con === null) con = await database.connect()

  try {
    const fileURN = eventBody.resourceUrn

    const OriginalName = eventBody.payload.name
    const userID = eventBody.payload.context.lineage.lastModifiedUserId
    const project = eventBody.hook.hookAttribute.projectId
    const extention = eventBody.payload.ext
    const folderURN = eventBody.payload.parentFolderUrn
    const ancestor = eventBody.payload.ancestors.find((value) => value.name === "CQ" || value.name === "PD")

    const token = await authorization.OAuth()

    const folderName = eventBody.payload.ancestors.find((value) => value.urn === folderURN)
    let subtipo = null;

    if (!ancestor) return { statusCode: 500, body: 'O Ancestral não foi encontrado.' }
    if (!folderName) return { statusCode: 500, body: 'O Folder não foi encontrado.' }

    if (ancestor.name === "CQ") subtipo = subtipos.CQ.find((value) => value.name == folderName.name /* && value.ancestor == eventBody.payload.ancestors[5].name */)
    else if (ancestor.name === "PD") subtipo = subtipos.PD.find((value) => value.name === folderName.name)

    if (!subtipo) return { statusCode: 500, body: 'O Subtipo não foi encontrado.' }

    var renamedFile = await database.select(OriginalName, subtipo.table, con)

    if (renamedFile.length === 0 && extention !== null) {

      var lastRow = await database.insert(OriginalName, 'pending', subtipo.table, con)
      const filename = `${subtipo.prefix}${lastRow.insertId}-${OriginalName}`

      await database.update(lastRow.insertId, filename, subtipo.table, con)

      var requestData = { jsonapi: { version: "1.0" }, data: { type: "versions", attributes: { name: filename } } }
      let header = { headers: { "Authorization": token, "x-user-id": userID } }

      await axios.post(`https://developer.api.autodesk.com/data/v1/projects/${project}/versions?copyFrom=${fileURN}`, requestData, header)
      con.end()
    } else {
      return { statusCode: 204, body: 'Sem alterações.' };
    }
  } catch (requestError) {
    return { statusCode: 400, body: 'Parâmetros inválidos.' };
  }

  return { statusCode: 200, body: 'Renomeado.' };
};

(async () => {
  const response = await handler({
    "version": "1.0",
    "resourceUrn": "urn:adsk.wipprod:fs.file:vf.lo0Fpcv1QFa9XQcBxWmoyg?version=3",
    "hook": {
      "hookId": "8d158a74-7e62-42b1-9f3e-646285c84dbc",
      "tenant": "urn:adsk.wipprod:fs.folder:co.mRCEl0T-Q0i4zbHGhUnZfg",
      "callbackUrl": "https://w65vk56447.execute-api.us-east-1.amazonaws.com/default",
      "createdBy": "6KZPJFZjW0F62NcCC7ljcAduKKeSHXcI",
      "event": "dm.version.added",
      "createdDate": "2024-11-02T14:17:25.673+00:00",
      "lastUpdatedDate": "2024-11-02T14:17:25.672+00:00",
      "system": "data",
      "creatorType": "Application",
      "status": "active",
      "scope": {
        "folder": "urn:adsk.wipprod:fs.folder:co.mRCEl0T-Q0i4zbHGhUnZfg"
      },
      "hookAttribute": {
        "projectId": "b.6f9fd46f-31b7-4955-98d8-acab385979a8"
      },
      "autoReactivateHook": false,
      "urn": "urn:adsk.webhooks:events.hook:8d158a74-7e62-42b1-9f3e-646285c84dbc",
      "callbackWithEventPayloadOnly": false,
      "projectId": "b.6f9fd46f-31b7-4955-98d8-acab385979a8",
      "hubId": "b.a438562f-8604-47b4-86ee-19ec21b13df4",
      "__self__": "/systems/data/events/dm.version.added/hooks/8d158a74-7e62-42b1-9f3e-646285c84dbc"
    },
    "payload": {
      "ext": "txt",
      "modifiedTime": "2024-11-02T16:57:18+0000",
      "creator": "U7MJQQS7K7URQ8KR",
      "lineageUrn": "urn:adsk.wipprod:dm.lineage:lo0Fpcv1QFa9XQcBxWmoyg",
      "sizeInBytes": 61,
      "hidden": false,
      "indexable": true,
      "source": "urn:adsk.wipprod:fs.file:vf.lo0Fpcv1QFa9XQcBxWmoyg?version=3",
      "version": "3",
      "user_info": {
        "id": "U7MJQQS7K7URQ8KR"
      },
      "name": "file.txt",
      "context": {
        "lineage": {
          "reserved": false,
          "reservedUserName": null,
          "reservedUserId": null,
          "reservedTime": null,
          "unreservedUserName": null,
          "unreservedUserId": null,
          "unreservedTime": null,
          "createUserId": "U7MJQQS7K7URQ8KR",
          "createTime": "2024-11-02T16:08:21+0000",
          "createUserName": "Gustavo Balmiza",
          "lastModifiedUserId": "U7MJQQS7K7URQ8KR",
          "lastModifiedTime": "2024-11-02T16:57:18+0000",
          "lastModifiedUserName": "Gustavo Balmiza"
        },
        "operation": "PostVersionedFiles"
      },
      "createdTime": "2024-11-02T16:57:18+0000",
      "modifiedBy": "U7MJQQS7K7URQ8KR",
      "state": "CONTENT_AVAILABLE",
      "parentFolderUrn": "urn:adsk.wipprod:fs.folder:co.OYUz00MNSLawf7lsu7EPPA",
      "ancestors": [
        {
          "name": "a438562f-8604-47b4-86ee-19ec21b13df4-account-root-folder",
          "urn": "urn:adsk.wipprod:fs.folder:co.ZMDxIgOZSDmuQdn1NfEgOQ"
        },
        {
          "name": "6f9fd46f-31b7-4955-98d8-acab385979a8-root-folder",
          "urn": "urn:adsk.wipprod:fs.folder:co.F2bciHCDQoiLP_2zBGUS7g"
        },
        {
          "name": "Project Files",
          "urn": "urn:adsk.wipprod:fs.folder:co.mRCEl0T-Q0i4zbHGhUnZfg"
        },
        {
          "name": "CQ",
          "urn": "urn:adsk.wipprod:fs.folder:co.pjjMz9DjTHajVJvxzj-dyw"
        },
        {
          "name": "CONTROLE DE QUALIDADE",
          "urn": "urn:adsk.wipprod:fs.folder:co.OYUz00MNSLawf7lsu7EPPA"
        }
      ],
      "project": "6f9fd46f-31b7-4955-98d8-acab385979a8",
      "tenant": "a438562f-8604-47b4-86ee-19ec21b13df4",
      "custom-metadata": {
        "storm:process-state": "NEEDS_PROCESSING",
        "dm_prop:document-type": "null",
        "dm_sys_id": "dded22b0-0150-4859-9e5f-95da0cb8235b",
        "file_name": "file.txt",
        "lineageTitle": "",
        "dm_command:id": "43704725-ee55-4bf1-921d-f6b90bf014af",
        "storm:entity-type": "SEED_FILE",
        "storm:action": "upload",
        "fileName": "file.txt"
      }
    }
  }, {
    callbackWaitsForEmptyEventLoop: false,
  });
  console.log(response);
})()