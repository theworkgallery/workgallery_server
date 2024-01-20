const PROFILE = require('../model/ProfileModel');

const AddEducation = async (req, res) => {
  const {
    schoolName,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    current,
    skills,
  } = req.body;
  console.log(skills);
  if (!schoolName || !degree || !fieldOfStudy || !startDate || !current) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    profile.education.unshift({
      schoolName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      current,
      skills,
    });
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddExperience = async (req, res) => {
  const { role, companyName, skills, startDate, current, description } =
    req.body;
  if (
    !role ||
    !skills ||
    !companyName ||
    !startDate ||
    !description ||
    !current
  ) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }

  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    profile.experience.unshift({
      role,
      companyName,
      skills,
      startDate,
      current,
      description,
    });
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddSkills = async (req, res) => {
  const { skills } = req.body;
  if (!skills) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    profile.skills.unshift(skills);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddProjects = async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !description || !link) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }

  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    profile.projects.unshift({ title, description, link });
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddCertifications = async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !description || !link) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }

  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    profile.certifications.unshift({ title, description, link });
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddAchievements = async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    profile.achievements.unshift({ title, description, link });
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteEducation = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    const removeIndex = profile.education.map((item) => item.id).indexOf(id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteExperience = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    const removeIndex = profile.experience.map((item) => item.id).indexOf(id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteSkills = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const removeIndex = profile.skills.map((item) => item.id).indexOf(id);
    profile.skills.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteProjects = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    const removeIndex = profile.projects.map((item) => item.id).indexOf(id);
    profile.projects.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteCertifications = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const removeIndex = profile.certifications
      .map((item) => item.id)
      .indexOf(id);
    profile.certifications.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const DeleteAchievements = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const removeIndex = profile.achievements.map((item) => item.id).indexOf(id);
    profile.achievements.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateEducation = async (req, res) => {
  const { id } = req.params;
  const {
    schoolName,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    current,
    skills,
  } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    const updateIndex = profile.education.map((item) => item.id).indexOf(id);
    profile.education[updateIndex] = {
      schoolName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      current,
      skills,
    };
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateExperience = async (req, res) => {
  const { id } = req.params;
  const { role, companyName, skills, startDate, current, description } =
    req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.experience.map((item) => item.id).indexOf(id);
    profile.experience[updateIndex] = {
      role,
      companyName,
      skills,
      startDate,
      current,
      description,
    };
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateSkills = async (req, res) => {
  const { id } = req.params;
  const { skills } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.skills.map((item) => item.id).indexOf(id);
    profile.skills[updateIndex] = skills;
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateProjects = async (req, res) => {
  const { id } = req.params;
  const { title, description, link } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.projects.map((item) => item.id).indexOf(id);
    profile.projects[updateIndex] = { title, description, link };
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateCertifications = async (req, res) => {
  const { id } = req.params;
  const { title, description, link } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.certifications
      .map((item) => item.id)
      .indexOf(id);
    profile.certifications[updateIndex] = { title, description, link };
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateAchievements = async (req, res) => {
  const { id } = req.params;
  const { title, description, link } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.achievements.map((item) => item.id).indexOf(id);
    profile.achievements[updateIndex] = { title, description, link };
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  AddEducation,
  AddExperience,
  AddSkills,
  AddProjects,
  AddCertifications,
  AddAchievements,
  DeleteEducation,
  DeleteExperience,
  DeleteSkills,
  DeleteProjects,
  DeleteCertifications,
  DeleteAchievements,
  UpdateEducation,
  UpdateExperience,
  UpdateSkills,
  UpdateProjects,
  UpdateCertifications,
  UpdateAchievements,
};
