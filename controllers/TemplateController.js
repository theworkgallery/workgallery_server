const Template = require('../models/template.model');
const { uploadImage } = require('./collectionController');
const GitHub = require('../models/github.model');
const mongoose = require('mongoose');
const Medium = require('../models/medium.model');
const User = require('../models/user.model');
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
    const { templateHtml, basePrice } = req.body;
    const file = req?.files[0] || null;
    const type = file?.mimetype?.split('/')[0] || null;
    console.log(file);
    const { fileLink, fileNameWithKey, error } = await uploadImage({
      type,
      file,
    });
    if (error) throw new Error(error);
    const newTemplate = Template.create({
      templateHtml,
      previewUrl: fileLink,
      key: fileNameWithKey,
      basePrice,
      createdBy: req.userId,
    });
    await newTemplate.save();
    res.status(201).json(newTemplate);
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

module.exports = {
  getAllGalleryData,
  getAllTemplates,
  AddTemplate,
  getTemplateById,
};
