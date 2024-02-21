const LinkedInDb = require('../models/linkedIn.model');
const axios = require('axios');
const LINKEDIN_SCRAPPER_URL = `${process.env.FLASK_APP_URL}/scrape_linkedin_profiles`;
const GIT_SCRAPPER_URL = `${process.env.FLASK_APP_URL}/scrape_github_profiles`;
const MEDIUM_SCRAPPER_URL = `${process.env.FLASK_APP_URL}/scrape_medium_profiles`;
const MEDIUM_DB = require('../models/medium.model');
const GIT_DB = require('../models/github.model');
const SocialProfile = require('../models/socials.model');
const UserCollection = require('../models/collection.model');
const User = require('../models/user.model');
const { ArrayFilter } = require('../utils/functions');
const { AwsUploadFile } = require('../utils/s3');
const { uploadImage } = require('./collectionController');
const mongoose = require('mongoose');
const getLinkedInData = async (req, res, next) => {
  const refresh = req.query.refresh;
  const id = req.userId;
  try {
    const profile = await SocialProfile.findOne({ user: id })
      .select('linkedin')
      .lean()
      .exec();
    if (!profile.linkedin) {
      return res.status(404).json({ message: 'LinkedIn username not found' });
    }
    if (refresh === 'true') {
      //for refresh
      const data = await getWebScrappingData({
        userName: profile.linkedin,
        url: LINKEDIN_SCRAPPER_URL,
      });
      console.log(data, 'profile');
      const update = {
        $set: {
          description: data?.description,
          education: saniTizeEducation(data?.education),
          experience: data?.experience,
          title: data?.title,
        },
      };

      const linkedInData = await LinkedInDb.findOneAndUpdate(
        { user: id },
        update,
        { new: true, upsert: true }
      ).exec(); //new returns the data after update
      //Update the user info
      const foundUser = await User.findById(id)
        .select('avatar title about')
        .exec();
      if (!foundUser) throw new Error('profile not found');
      if (!foundUser.avatar.edited) {
        foundUser.avatar.fileUrl = data?.displayPictureUrl;
      }
      if (!foundUser.title.edited) {
        foundUser.title.text = data?.description;
      }
      if (!foundUser.about.edited) {
        foundUser.about.text = data?.title;
      }
      await foundUser.save();

      return res.status(201).json(linkedInData);
    }

    //if linked data is found just return the data
    const linkedInData = await LinkedInDb.findOne({ user: id }).lean().exec();
    if (linkedInData) {
      return res.status(200).json(linkedInData);
    }

    const data = await getWebScrappingData({
      userName: profile.linkedin,
      url: LINKEDIN_SCRAPPER_URL,
    });

    const linedInDB = await LinkedInDb.create({
      user: id,
      description: data?.description,
      education: saniTizeEducation(data?.education) || [],
      experience: data?.experience,
      title: data?.title,
    });

    const foundUser = await User.findById(id)
      .select('avatar title about')
      .exec();
    if (!foundUser) throw new Error('User not found');
    if (!foundUser.avatar.edited) {
      foundUser.avatar.fileUrl = data?.displayPictureUrl;
    }
    if (!foundUser.title.edited) {
      foundUser.title.text = data?.description;
    }
    if (!foundUser.about.edited) {
      foundUser.about.text = data?.title;
    }

    await foundUser.save();

    return res.status(200).json(linedInDB);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getMediumData = async (req, res, next) => {
  const refresh = req.query.refresh;
  console.log('refresh', refresh);
  const id = req.userId;
  try {
    const profile = await SocialProfile.findOne({ user: id })
      .select('medium')
      .lean()
      .exec();
    if (!profile.medium) {
      throw new Error('Medium username not found');
    }
    console.log(profile, 'Profile from Medium');
    if (refresh === 'true') {
      // Retrieve isGallery repos
      const existingMediumPosts = await MEDIUM_DB.aggregate([
        {
          $project: {
            filteredPosts: {
              $filter: {
                input: '$posts',
                as: 'post',
                cond: { $eq: ['$$post.isGallery', true] },
              },
            },
            // Include other fields of the parent document as needed
          },
        },
        {
          $unwind: '$filteredPosts',
        },
        {
          $replaceRoot: { newRoot: '$filteredPosts' },
        },
      ]);

      const postMap = new Map(
        existingMediumPosts.map((post) => [post.title, post])
      );

      //Fetch new GitHub data
      const newData = await getWebScrappingData({
        userName: profile.medium,
        url: MEDIUM_SCRAPPER_URL,
      });

      if (!newData) return res.status(200).json('failed to fetch data');
      // Merge and check for changes
      const mergedPosts = newData
        .map((newPost) => {
          const existingPost = postMap.get(newPost.title);
          if (existingPost) {
            // If no significant changes, mark the new repo as isGallery
            return { ...newPost, isGallery: true };
          } else if (existingPost) {
            // If there are changes, add both versions
            return [existingPost, newPost];
          }
          return newPost;
        })
        .flat(); // Flatten in case of adding both versions

      // Update database with merged data
      const update = { $set: { posts: mergedPosts } };
      const { posts } = await MEDIUM_DB.findOneAndUpdate({ user: id }, update, {
        new: true,
        upsert: true,
      })
        .select('posts')
        .lean()
        .exec();
      // console.log(Data.posts, 'Posts from DB');
      // console.log(mergedPosts, 'Merged Posts');
      console.log(posts, 'Posts from DB');
      const filtered = ArrayFilter({
        arr: posts,
        property: 'isGallery',
        condition: (isGallery) => isGallery === false,
      });
      return res.status(201).json(filtered);
    }

    const FoundMediumData = await MEDIUM_DB.findOne({ user: id })
      .select('posts')
      .lean()
      .exec();
    if (FoundMediumData) {
      const FilteredRepos = ArrayFilter({
        arr: FoundMediumData.posts,
        property: 'isGallery',
        condition: (isGallery) => isGallery === false,
      });

      return res.status(200).json(FilteredRepos);
    }

    const data = await getWebScrappingData({
      userName: profile.medium,
      url: MEDIUM_SCRAPPER_URL,
    });
    const newMediumData = await MEDIUM_DB.create({
      user: id,
      posts: data || [],
    });
    return res.status(200).json(newMediumData.posts);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getGitHubData = async (req, res, next) => {
  const refresh = req.query.refresh;
  const id = req.userId;
  try {
    const profile = await SocialProfile.findOne({ user: id })
      .select('github')
      .lean()
      .exec();

    if (!profile.github) {
      throw new Error('github user name not found');
    }

    if (refresh === 'true') {
      const foundUser = await GIT_DB.findOne({ user: id })
        .select('user')
        .lean()
        .exec();
      if (!foundUser) {
        return res.json({ message: 'User not found' });
      }
      const existingGalleryRepos = await GIT_DB.aggregate([
        {
          $project: {
            filteredRepos: {
              $filter: {
                input: '$repos',
                as: 'repo',
                cond: {
                  $or: [
                    { $eq: ['$$repo.isGallery', true] },
                    { $eq: ['$$repo.editedData.isModified', true] },
                  ],
                },
              },
            },
            // Include other fields of the parent document as needed
          },
        },
        {
          $unwind: '$filteredRepos',
        },
        {
          $replaceRoot: { newRoot: '$filteredRepos' },
        },
      ]);

      const galleryRepoMap = new Map(
        existingGalleryRepos.map((repo) => [repo.id, repo])
      );
      console.log(galleryRepoMap, 'galleryRepoMap');
      //Fetch new GitHub data
      const newData = await getWebScrappingData({
        userName: profile.github,
        url: GIT_SCRAPPER_URL,
      });
      console.log(newData);
      if (!newData) return res.status(400).json('failed to fetch data');
      // Merge and check for changes
      const mergedRepos = newData.map((newRepo) => {
        const existingRepo = galleryRepoMap.get(newRepo.id);
        console.log(existingRepo);
        if (existingRepo) {
          // Merge isGallery and editedData from existingRepo into newRepo
          return {
            ...newRepo, // New scraped data
            isGallery: existingRepo.isGallery, // Retain existing isGallery status
            editedData: existingRepo.editedData, // Retain any existing editedData
          };
        }
        // For new repos that don't exist in the database, return them as is
        return newRepo;
      });
      console.log(mergedRepos);
      const update = { $set: { repos: mergedRepos } };
      const { repos } = await GIT_DB.findOneAndUpdate({ user: id }, update, {
        new: true,
        upsert: true,
      })
        .select('repos')
        .lean()
        .exec();
      //console.log(mergedRepos)

      console.log(repos, 'mergedRepos In db');
      return res.status(201).json(mergedRepos);
    }

    const GIT_REPOS = await GIT_DB.findOne({ user: id })
      .select('-repos.forks -repos.stars -repos.readme')
      .lean()
      .exec();
    if (GIT_REPOS) {
      return res.status(200).json(GIT_REPOS.repos);
    }

    const data = await getWebScrappingData({
      userName: profile.github,
      url: GIT_SCRAPPER_URL,
    });

    const newGithubData = await GIT_DB.create({
      user: id,
      repos: data || [],
    });

    console.log(newGithubData?.repos);
    return res.status(200).json(newGithubData.repos);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const updateGithubUserName = async (req, res, next) => {
  const { userName } = req.body;
  const { userId } = req;
  try {
    const profile = await SocialProfile.findOne({ user: userId })
      .select('github user')
      .exec();
    if (!profile) {
      const newSocialProfile = await SocialProfile.create({
        user: userId,
        github: userName,
      });
      console.log(newSocialProfile);
      return res.status(201).json({ message: 'Github username updated' });
    }
    profile.github = userName;
    await profile.save();
    return res.status(200).json({ message: 'Github username updated' });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const updateMediumUserName = async (req, res, next) => {
  const { userName } = req.body;
  const userId = req?.userId;
  try {
    const profile = await SocialProfile.findOne({ user: userId })
      .select('medium user')
      .exec();
    if (!profile) {
      const newProfile = await SocialProfile.create({
        user: userId,
        medium: userName,
      });
      console.log(newProfile);
      return res.status(201).json({ message: 'medium username updated' });
    }
    profile.medium = userName;
    await profile.save();
    return res.status(200).json({ message: 'Medium username updated' });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const updateLinkedInUserName = async (req, res, next) => {
  const { userName } = req.body;
  const userId = req?.userId;
  try {
    const profile = await SocialProfile.findOne({ user: userId })
      .select('user linkedin')
      .exec();
    if (!profile) {
      const newProfile = await SocialProfile.create({
        user: userId,
        linkedin: userName,
      });
      console.log(newProfile);
      return res.status(201).json({ message: 'linkedin username updated' });
    }
    profile.linkedin = userName;
    await profile.save();
    return res.status(200).json({ message: 'LinkedIn username updated' });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getWebScrappingData = async ({ userName, url }) => {
  try {
    const response = await axios.post(
      url,
      { profile: userName },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

function saniTizeEducation(education) {
  if (education.length === 0) return null;
  return education.map((each) => {
    return {
      degreeName: each.degreeName || 'Not found',
      fieldOfStudy: each.fieldOfStudy || 'Not found',
      grade: each.grade || 0,
      projects: each.projects || [],
      schoolName: each.schoolName || 'Not found',
      timePeriod: each.timePeriod || 'Not found',
    };
  });
}

const getSingleRepositoryData = async (req, res, next) => {
  const repoID = req.params.id;
  // if (!repoId && !repoId.length > 23) {
  //   return res.json({ message: 'invalid id' });
  // }

  // console.log(repoId, 'Repoid');
  const userId = req.userId;
  console.log(userId);
  const repoId = new mongoose.Types.ObjectId(repoID);
  try {
    // const repo = await GIT_DB.findOne({ user: userId })
    //   .select('repos')
    //   .lean()
    //   .exec();
    // if (!repo) {
    //   return res.status(404).json({ message: 'Repository not found' });
    // }
    // const foundRepo = repo.repos.find((each) => each._id == repoId);
    const foundRepo = await GIT_DB.aggregate([
      {
        $match: { 'repos._id': repoId },
      },
      {
        $unwind: '$repos',
      },
      {
        $match: { 'repos._id': repoId },
      },
      {
        $replaceRoot: { newRoot: '$repos' },
      },
    ]);
    if (!foundRepo) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    return res.status(200).json(foundRepo[0]);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const AddSocialPlatforms = async (req, res, next) => {
  const { platforms = {} } = req.body;
  console.log(req.body);
  console.log(platforms);
  const userId = req.userId;
  try {
    const profile = await SocialProfile.findOne({ user: userId })
      .select('user')
      .exec();
    console.log(profile, 'FoundProfile');
    if (!profile) {
      platforms.user = new mongoose.Types.ObjectId(userId);
      const newProfile = await SocialProfile.create(platforms);
      console.log(newProfile, 'new profile');
      return res.json(newProfile);
    } else {
      console.log('ProfileExist');
      // If a profile exists, update it with the new platforms
      Object.keys(platforms).forEach((key) => {
        if (profile[key] !== undefined || profile[key] !== 'false') {
          // Make sure we only update existing fields
          profile[key] = platforms[key];
        }
      });
      const updatedProfile = await profile.save(); // Save the updated document
      console.log(updatedProfile, 'Updated Profile');
      res
        .status(200)
        .json({ message: 'Social profile updated', data: updatedProfile });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getAllSocialProfiles = async (req, res, next) => {
  const userId = req.userId;
  try {
    const profile = await SocialProfile.findOne({ user: userId }).lean().exec();
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    const excludeKeys = ['_id', 'user', '__v'];

    // Transform the data object into an array of { platform, username } objects
    const platformsArray = Object.keys(profile)
      .filter((key) => !excludeKeys.includes(key) && profile[key] !== 'false') // Exclude non-platform fields and 'false' values
      .map((key) => {
        return { platform: key, username: profile[key] };
      });
    return res.json(platformsArray);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const getSingleMediumPostData = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const foundPost = await MEDIUM_DB.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $project: {
          filteredPosts: {
            $filter: {
              input: '$posts',
              as: 'post',
              cond: {
                $eq: ['$$post._id', new mongoose.Types.ObjectId(postId)],
              },
            },
          },
          // Include other fields of the parent document as needed
        },
      },
      {
        $unwind: '$filteredPosts',
      },
      {
        $replaceRoot: { newRoot: '$filteredPosts' },
      },
    ]);

    if (foundPost.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(200).json(foundPost[0]);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const addGitRepoToGallery = async (req, res, next) => {
  const { id } = req.params;
  const user = req.userId;

  try {
    // Retrieve the profile and ensure execution
    const foundProfile = await GIT_DB.findOne({ user: user }).exec();

    // Check if the profile was not found
    if (!foundProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find the specific repository using MongoDB ObjectId for accurate comparison
    const repoId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId
    let foundRepoIndex = foundProfile.repos.findIndex((repo) =>
      repo._id.equals(repoId)
    );

    // Check if the repo was not found
    if (foundRepoIndex === -1) {
      return res.status(404).json({ message: 'Repo not found' });
    }

    // Toggle the isGallery value for the found repository
    foundProfile.repos[foundRepoIndex].isGallery =
      !foundProfile.repos[foundRepoIndex].isGallery;

    // Save the changes to the document
    await foundProfile.save();

    // Respond with the updated isGallery status of the repository
    return res
      .status(200)
      .json({ Gallery: foundProfile.repos[foundRepoIndex].isGallery });
  } catch (err) {
    console.error(err); // Log the error to the console for debugging
    return next(err); // Pass the error to the next middleware (error handler)
  }
};

const UpdateGitRepo = async (req, res, next) => {
  console.log('im here');
  const { id } = req.params;
  const { title, description } = req.body;
  const user = req.userId;

  try {
    // Retrieve the profile and ensure execution
    const foundProfile = await GIT_DB.findOne({ user: user }).exec();
    // Check if the profile was not found
    if (!foundProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    const file = req?.files[0];
    const type = file?.mimetype?.split('/')[0];
    const { fileLink, fileNameWithKey, error } = await uploadImage({
      type,
      file,
    });

    if (!file || !description || !title) {
      return res
        .status(400)
        .json({ message: 'file, title or description are required' });
    }

    // Find the specific repository using MongoDB ObjectId for accurate comparison
    const repoId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId
    let foundRepoIndex = foundProfile.repos.findIndex((repo) =>
      repo._id.equals(repoId)
    );

    // Check if the repo was not found
    if (foundRepoIndex === -1) {
      return res.status(404).json({ message: 'Repo not found' });
    }

    // Toggle the isGallery value for the found repository
    if (fileLink)
      foundProfile.repos[foundRepoIndex].editedData.fileUrl = fileLink;
    if (title) foundProfile.repos[foundRepoIndex].editedData.title = title;
    if (description)
      foundProfile.repos[foundRepoIndex].editedData.description = description;
    foundProfile.repos[foundRepoIndex].editedData.isModified = true;
    // Save the changes to the document
    await foundProfile.save();
    // Respond with the updated isGallery status of the repository
    return res.status(200).json({ message: 'updated' });
  } catch (err) {
    console.error(err); // Log the error to the console for debugging
    return next(err); // Pass the error to the next middleware (error handler)
  }
};

const AddRepoToCollection = async (req, res, next) => {
  console.log('im here');
  const { repoid, collectionId } = req.params;
  const user = req.userId;
  try {
    const foundProfile = await GIT_DB.findOne({ user: user }).exec();
    if (!foundProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    const repoId = new mongoose.Types.ObjectId(repoid);
    let foundRepoIndex = foundProfile.repos.findIndex((repo) =>
      repo._id.equals(repoId)
    );

    if (foundRepoIndex === -1) {
      return res.status(404).json({ message: 'Repo not found' });
    }
    const result = await UserCollection.findByIdAndUpdate(
      collectionId,
      {
        $push: { addedData: foundProfile.repos[foundRepoIndex] },
      },
      {
        new: true,
      }
    );
    console.log(result);

    return res.status(200).json({ message: 'Added to collection' });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

module.exports = {
  getLinkedInData,
  getGitHubData,
  getMediumData,
  updateGithubUserName,
  updateMediumUserName,
  UpdateGitRepo,
  updateLinkedInUserName,
  getSingleRepositoryData,
  AddSocialPlatforms,
  getSingleMediumPostData,
  getAllSocialProfiles,
  addGitRepoToGallery,
  AddRepoToCollection,
};
