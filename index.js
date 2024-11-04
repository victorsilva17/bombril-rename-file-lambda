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

exports.handler = async (event, context) => {

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

    if (ancestor.name === "CQ") subtipo = subtipos.CQ.find((value) => value.name == folderName.name && value.ancestor == eventBody.payload.ancestors[5].name)
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