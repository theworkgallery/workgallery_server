const templates = require('../models/template.model');


async function findTemplateById(id) {
    return await templates.findById(id);
}


module.exports = {
    findTemplateById
}