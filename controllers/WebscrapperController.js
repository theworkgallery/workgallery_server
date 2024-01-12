const LinkedInDb = require('../model/linkedInModel');

const Profile = require('../model/ProfileModel');
const axios = require('axios');
const LINKEDIN_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_linkedin_profiles';
const GIT_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_github_profiles';
const MEDIUM_SCRAPPER_URL = 'http://127.0.0.1:5000/scrape_medium_profiles';
const MEDIUM_DB = require('../model/mediumModel');
const GIT_DB = require('../model/githubModel');

const getLinkedInData = async (req, res) => {
  const refresh = req.query.refresh;
  const id = req.user;
  try {
    const profile = await Profile.findOne({ user: id });
    if (!profile.linkedInUserName) {
      return res.status(404).json({ message: 'LinkedIn username not found' });
    }
    if (refresh === 'true') {
      //for refresh
      const data = await getWebScrappingData({
        userName: profile.linkedInUserName,
        url: LINKEDIN_SCRAPPER_URL,
      });
      console.log(data, 'profile');
      const update = {
        $set: {
          description: data?.description,
          education: saniTizeEducation(data?.education),
          experience: data?.experience,
          profile: data?.displayPictureUrl,
          title: data?.title,
        },
      };
      const linkedInData = await LinkedInDb.findOneAndUpdate(
        { user: id },
        update,
        { new: true, upsert: true }
      ).exec(); //new returns the data after update
      return res.status(201).json(linkedInData);
    }
    const linkedInData = await LinkedInDb.findOne({ user: id }).lean().exec();
    if (linkedInData) {
      return res.status(200).json(linkedInData);
    }

    const data = await getWebScrappingData({
      userName: profile.linkedInUserName,
      url: LINKEDIN_SCRAPPER_URL,
    });

    const linedInDB = await LinkedInDb.create({
      user: id,
      description: data?.description,
      education: saniTizeEducation(data?.education) || [],
      experience: data?.experience,
      profile: data?.displayPictureUrl,
      title: data?.title,
    });
    return res.status(200).json(linedInDB);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
const getMediumData = async (req, res) => {
  const refresh = req.query.refresh;
  console.log('refresh', refresh);
  const id = req.user;
  try {
    const profile = await Profile.findOne({ user: id });
    if (!profile.mediumUserName) {
      return res.status(404).json({ message: 'Medium username not found' });
    }
    console.log(profile);
    if (refresh === 'true') {
      //for refresh
      const data = await getWebScrappingData({
        userName: profile.mediumUserName,
        url: MEDIUM_SCRAPPER_URL,
      });
      console.log(data, 'data from refresh');
      const update = {
        $set: {
          posts: data || [],
        },
      };
      const mediumData = await MEDIUM_DB.findOneAndUpdate(
        { user: id },
        update,
        { new: true, upsert: true }
      ).exec(); //new returns the data after update
      return res.status(201).json(mediumData);
    }
    const FoundMediumData = await MEDIUM_DB.findOne({ user: id }).lean().exec();
    if (FoundMediumData) {
      return res.status(200).json(FoundMediumData);
    }

    const data = await getWebScrappingData({
      userName: profile.mediumUserName,
      url: MEDIUM_SCRAPPER_URL,
    });

    const newMediumData = await MEDIUM_DB.create({
      user: id,
      posts: data || [],
    });
    return res.status(200).json(newMediumData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getGitHubData = async (req, res) => {
  const refresh = req.query.refresh;
  const id = req.user;
  try {
    const profile = await Profile.findOne({ user: id });
    if (!profile.githubUserName) {
      return res.status(404).json({ message: 'Github username not found' });
    }
    console.log(refresh === 'true');
    if (refresh === 'true') {
      //for refresh
      const data = await getWebScrappingData({
        userName: profile.githubUserName,
        url: GIT_SCRAPPER_URL,
      });
      console.log(data, 'data git');
      const update = {
        $set: {
          repos: data || [],
        },
      };
      const githubData = await GIT_DB.findOneAndUpdate({ user: id }, update, {
        new: true,
        upsert: true,
      }).exec(); //new returns the data after update
      return res.status(201).json(githubData);
    }
    const FoundGithubData = await GIT_DB.findOne({ user: id }).lean().exec();
    if (FoundGithubData) {
      return res.status(200).json(FoundGithubData);
    }

    const data = await getWebScrappingData({
      userName: profile.githubUserName,
      url: GIT_SCRAPPER_URL,
    });
    console.log(data);
    const newGithubData = await GIT_DB.create({
      user: id,
      repos: data || [],
    });
    return res.status(200).json(newGithubData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateGithubUserName = async (req, res) => {
  const { userName } = req.body;
  const userId = req?.user;
  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      const newProfile = await Profile.create({
        user: userId,
        githubUserName: userName,
      });
      console.log(newProfile);
      return res.status(201).json({ message: 'Github username updated' });
    }
    profile.githubUserName = userName;
    await profile.save();
    return res.status(200).json({ message: 'Github username updated' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateMediumUserName = async (req, res) => {
  const { userName } = req.body;
  const userId = req?.user;
  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      const newProfile = await Profile.create({
        user: userId,
        mediumUserName: userName,
      });
      console.log(newProfile);
      return res.status(201).json({ message: 'medium username updated' });
    }
    profile.mediumUserName = userName;
    await profile.save();
    return res.status(200).json({ message: 'Medium username updated' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateLinkedInUserName = async (req, res) => {
  const { userName } = req.body;
  const userId = req?.user;
  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      const newProfile = await Profile.create({
        user: userId,
        linkedInUserName: userName,
      });
      console.log(newProfile);
      return res.status(201).json({ message: 'linkedin username updated' });
    }
    profile.linkedInUserName = userName;
    await profile.save();
    return res.status(200).json({ message: 'LinkedIn username updated' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal Server Error' });
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
module.exports = {
  getLinkedInData,
  getGitHubData,
  getMediumData,
  updateGithubUserName,
  updateMediumUserName,
  updateLinkedInUserName,
};
