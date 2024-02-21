const Template = require('../models/template.model');

const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find().select(
      'basePrice templateName previewUrl createdBy'
    );
    if (!templates) return res.json({ message: 'No templates found' });
    res.status(200).json(templates);
  } catch (error) {
    console.log(error);
    next(err);
  }
};
const AddTemplate = async (req, res, next) => {
  try {
    const { templateHtml, basePrice, PreviewUrl } = req.body;
    const newTemplate = Template.create({
      templateHtml,
      basePrice,
      createdBy: req.userId,
    });
    await newTemplate.save();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getTemplateById = async () => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);
    if (!template) return res.json({ message: 'No template found' });
    res.status(200).json(template);
  } catch (error) {
    console.log(error);
    next(err);
  }
};
module.exports = {
  getAllTemplates,
  AddTemplate,
  getTemplateById,
};
