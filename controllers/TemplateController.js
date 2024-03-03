const Template = require('../models/template.model');
const { uploadImage } = require('./collectionController');
const GitHub = require('../models/github.model');
const TemplateUserMap = require('../models/TemplateUsers.model');
const mongoose = require('mongoose');
const Medium = require('../models/medium.model');
const User = require('../models/user.model');
const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find().select(
      'basePrice templateName previewUrl createdBy'
    );
    console.log(templates);
    if (!templates) return res.json({ message: 'No templates found' });
    res.status(200).json(templates);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const createTemplate = async (req, res, next) => {
  try {
    const { templateHtml, basePrice, templateName } = req.body;
    console.log(req?.files, 'Req.files');
    const file = req?.files ? req.files[0] : null;
    if (!file) throw new Error('Preview is required');

    const type = file?.mimetype?.split('/')[0] || null;
    console.log(file);
    const { fileLink, fileNameWithKey, error } = await uploadImage({
      type,
      file,
    });
    if (error) throw new Error(error);
    const newTemplate = new Template({
      templateHtml,
      previewUrl: fileLink,
      key: fileNameWithKey,
      basePrice,
      templateName,
      createdBy: req.userId,
    });
    await newTemplate.save();
    res.status(201).json({ message: 'Template has been added' });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id, 'template id');
    const template = await Template.findById(id)
      .select('templateHtml')
      .lean()
      .exec();
    console.log(template);
    if (!template) return res.json({ message: 'No template found' });
    res.status(200).json(template);
  } catch (error) {
    console.log(error);
    next(err);
  }
};

const getAllGalleryData = async (req, res, next) => {
  console.log('Im here');
  try {
    const userData = await User.findById(req.userId)
      .select('title avatar email designation')
      .exec();
    const GitHubRepos =
      (await GitHub.aggregate([
        {
          $match: { user: new mongoose.Types.ObjectId(req.userId) },
        },
        {
          $project: {
            filteredRepos: {
              $filter: {
                input: '$repos',
                as: 'repo',
                cond: { $eq: ['$$repo.isGallery', true] },
              },
            },
            // You can include other fields here if needed
          },
        },
        {
          $unwind: '$filteredRepos',
        },
        {
          $replaceRoot: { newRoot: '$filteredRepos' },
        },
      ])) || [];

    const mediumPosts = await Medium.aggregate([
      // Match posts based on criteria
      {
        $match: {
          isGallery: true,
          user: new mongoose.Types.ObjectId(req.userId),
        },
      },
      // Project fields (select only 'content' and 'fileUrl')
      { $project: { posts: 1, _id: 0 } },
    ]);

    const transFormedData = {
      title: userData.title.text,
      avatar: userData.avatar.fileUrl,
      email: userData.email,
      designation: userData.designation,
      galleries: [
        ...GitHubRepos?.map((gallery) => ({
          id: gallery.id,
          title: gallery.editedData.isModified
            ? gallery.editedData.title
            : gallery.title,
          description: gallery.editedData.isModified
            ? gallery.editedData.title
            : gallery.description,
          sourceUrl: gallery.sourceUrl,
          fileUrl: gallery.editedData.isModified
            ? gallery.editedData.fileUrl
            : null,
        })),
        ...mediumPosts?.map((gallery) => ({
          id: gallery._id,
          title: gallery.editedData.isModified
            ? gallery.editedData.title
            : gallery.title,
          description: gallery.editedData.isModified
            ? gallery.editedData.title
            : gallery.description,
          sourceUrl: gallery.sourceUrl,
          fileUrl: gallery.editedData.isModified
            ? gallery.editedData.fileUrl
            : gallery.fileUrl,
        })),
      ],
    };

    return res.status(200).json(transFormedData);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const addToGallery = async (req, res, next) => {
  try {
    const { target } = req.body;
    if (!target) {
      return res
        .status(400)
        .json({ message: 'Template ID is required', status: false });
    }

    // Check for duplicates
    const existingMap = await TemplateUserMap.findOne({
      templateId: target,
      user: req.userId,
    });
    if (existingMap) {
      return res
        .status(409)
        .json({ message: 'Template already added to gallery', status: false });
    }

    const newTemplateUserMap = new TemplateUserMap({
      templateId: target,
      user: req.userId,
    });
    await newTemplateUserMap.save();
    res
      .status(201)
      .json({ message: 'Template added to gallery', status: true });
  } catch (err) {
    console.error(err); // Consider a more sophisticated logging approach
    next(err);
  }
};

const getAllTemplatesOfUser = async (req, res, next) => {
  try {
    const templates = await TemplateUserMap.find({ user: req.userId })
      .populate('templateId') // Assuming you want only these fields
      .exec(); // Explicitly executing the query
    console.log(templates);
    if (!templates.length) {
      return res
        .status(404)
        .json({ message: 'No templates found for this user' });
    }

    res.json(templates);
  } catch (err) {
    console.error(err); // Consider using a more sophisticated logging approach
    next(err);
  }
};

const getTemplateStatusOfUser = async (req, res, next) => {
  try {
    const { target } = req.params; // or req.body, depending on how the template ID is being sent

    if (!target) {
      // If 'target' is not provided, return a bad request response
      throw new Error('Template ID is required.');
    }

    // Use .exists() to check if any document matches the criteria
    const exists = await TemplateUserMap.exists({
      templateId: target,
      user: req.userId,
    });

    res.status(200).json({ status: !!exists }); // Convert the result to a boolean and return
  } catch (err) {
    console.error(err); // Consider using a more sophisticated logging strategy for production
    next(err); // Pass the error to the next error handling middleware
  }
};

module.exports = {
  getAllGalleryData,
  getAllTemplates,
  createTemplate,
  getTemplateById,
  addToGallery,
  getAllTemplatesOfUser,
  getTemplateStatusOfUser,
};
