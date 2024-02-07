const LinkedInDb = require('../models/linkedin.model');
const axios = require('axios');
const LINKEDIN_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_linkedin_profiles';
const GIT_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_github_profiles';
const MEDIUM_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_medium_profiles';
const MEDIUM_DB = require('../models/medium.model');
const GIT_DB = require('../models/github.model');
const SocialProfile = require('../models/socials.model');
const User = require('../models/user.model');
const { ArrayFilter } = require('../utils/functions');
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
    console.log(refresh === 'true');
    // if (refresh === 'true') {
    //   //for refresh
    //   const data = await getWebScrappingData({
    //     userName: profile.githubUserName,
    //     url: GIT_SCRAPPER_URL,
    //   });
    //   console.log(data, 'data git');
    //   const update = {
    //     $set: {
    //       repos: data || [],
    //     },
    //   };

    //   const githubData = await GIT_DB.findOneAndUpdate({ user: id }, update, {
    //     new: true,
    //     upsert: true,
    //   }).exec(); //new returns the data after update
    //   return res.status(201).json(githubData);
    // }

    if (refresh === 'true') {
      // Retrieve isGallery repos
      // const existingGalleryRepos = await GIT_DB.find(
      //   { user: id },
      //   { repos: { $elemMatch: { isGallery: true } } }
      // ).exec();

      const existingGalleryRepos = await GIT_DB.aggregate([
        // {
        //   $unwind: '$repos',
        // },
        // {
        //   $match: { 'repos.isGallery': true },
        // },
        // {
        //   $project: {
        //     repos: 1,
        //     _id: 0,
        //   },
        // },

        // {
        //   $project: {
        //     repos: {
        //       $filter: {
        //         input: '$repos',
        //         as: 'repo',
        //         cond: { $eq: ['$$repo.isGallery', true] },
        //       },
        //     },
        //     // Include other fields of the parent document as needed
        //   },
        // },
        {
          $project: {
            filteredRepos: {
              $filter: {
                input: '$repos',
                as: 'repo',
                cond: { $eq: ['$$repo.isGallery', true] },
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
        existingGalleryRepos.map((repo) => [repo.name, repo])
      );
      //Fetch new GitHub data
      const newData = await getWebScrappingData({
        userName: profile.github,
        url: GIT_SCRAPPER_URL,
      });

      // Merge and check for changes
      const mergedRepos = newData
        .map((newRepo) => {
          const existingRepo = galleryRepoMap.get(newRepo.name);
          if (existingRepo && existingRepo.readme === newRepo.readme) {
            // If no significant changes, mark the new repo as isGallery
            return { ...newRepo, isGallery: true };
          } else if (existingRepo) {
            // If there are changes, add both versions
            return [existingRepo, newRepo];
          }
          return newRepo;
        })
        .flat(); // Flatten in case of adding both versions

      //Update database with merged data
      const update = { $set: { repos: mergedRepos } };
      const { repos } = await GIT_DB.findOneAndUpdate({ user: id }, update, {
        new: true,
        upsert: true,
      })
        .select('repos')
        .lean()
        .exec();
      //console.log(mergedRepos);

      const filtered = ArrayFilter({
        arr: repos,
        property: 'isGallery',
        condition: (isGallery) => isGallery === false,
      });

      return res.status(201).json(filtered);
    }

    const GIT_REPOS = await GIT_DB.findOne({ user: id })
      .select('repos')
      .lean()
      .exec();
    if (GIT_REPOS) {
      const FilteredRepos = ArrayFilter({
        arr: GIT_REPOS.repos,
        property: 'isGallery',
        condition: (isGallery) => isGallery === false,
      });
      console.log(FilteredRepos);
      return res.status(200).json(FilteredRepos);
    }

    const data = await getWebScrappingData({
      userName: profile.github,
      url: GIT_SCRAPPER_URL,
    });

    const newGithubData = await GIT_DB.create({
      user: id,
      repos: data || [],
    });

    // newGithubData.repos = ArrayFilter({
    //   arr: newGithubData?.repos,
    //   property: 'isGallery',
    //   condition: (isGallery) => isGallery === false,
    // });
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
      { profiles: [userName] },
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
  const repoId = req.params.id;
  console.log(repoId);
  const userId = req.userId;
  try {
    // const repo = await GIT_DB.findOne({ user: userId })
    //   .select('repos')
    //   .lean()
    //   .exec();
    // if (!repo) {
    //   return res.status(404).json({ message: 'Repository not found' });
    // }
    // const foundRepo = repo.repos.find((each) => each._id == repoId);
    // if (!foundRepo) {
    //   return res.status(404).json({ message: 'Repository not found' });
    // }
    // return res.status(200).json(foundRepo);
    const objectIdRepoId = new mongoose.Types.ObjectId(repoId);

    const result = await GIT_DB.aggregate([
      // Match the user first to narrow down the search
      { $match: { user: userId } },
      // Unwind the repos array to treat each element as a separate document
      { $unwind: '$repos' },
      // Match the specific repo by its id
      { $match: { 'repos._id': objectIdRepoId } },
      // Optionally, project the fields you want to return
      {
        $project: {
          _id: '$repos._id',
          name: '$repos.name',
          description: '$repos.description',
          // Add any other repo fields you need here
        },
      },
    ]);

    // Since aggregate returns an array, check if we have any results
    if (result.length === 0) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    console.log(result);

    // Return the first (and should be only) matched repo
    return res.status(200).json(result[0]);
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
      platforms.user = userId;
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
          console.log(platforms[key], 'Updated');
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

module.exports = {
  getLinkedInData,
  getGitHubData,
  getMediumData,
  updateGithubUserName,
  updateMediumUserName,
  updateLinkedInUserName,
  getSingleRepositoryData,
  AddSocialPlatforms,
  getSingleMediumPostData,
  getAllSocialProfiles,
};
