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

  if (!schoolName || !degree || !fieldOfStudy || !startDate || !current) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user }).select(
      'education'
    );
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
  const {
    role,
    companyName,
    skills,
    startDate,
    endDate,
    current,
    description,
  } = req.body;
  console.log(role, companyName, skills, startDate, current, description);
  if (
    !role ||
    !companyName ||
    !skills ||
    !startDate ||
    !current ||
    !description
  ) {
    return res.status(400).json({ message: 'Please fill all the fields' });
  }

  try {
    const profile = await PROFILE.findOne({ user: req.user }).select(
      'experience'
    );
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
      endDate,
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
  console.log(skills);
  if (!skills) {
    return res
      .status(400)
      .json({ message: 'Please fill all the fields' })
      .select('skills');
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    profile.skills.unshift(...skills);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const AddProject = async (req, res) => {
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

const AddCertification = async (req, res) => {
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

const AddAchievement = async (req, res) => {
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

const AddLanguages = async (req, res) => {
  const { languages } = req.body;
  if (!languages) {
    return res.status(400).json({ message: 'language is required' });
  }
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    profile.languages.unshift(...languages);
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

const DeleteLanguage = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await PROFILE.findOne({ user: req.user });
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const removeIndex = profile.languages.map((item) => item.id).indexOf(id);
    console.log(removeIndex);
    profile.languages.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateEducation = async (req, res) => {
  const {
    id,
    schoolName,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    current,
    skills,
    isPublic,
  } = req.body;

  try {
    const profile = await PROFILE.findOne({ user: req.user }).select(
      'education'
    );

    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }

    const updateIndex = profile.education.findIndex((edu) => edu.id === id);
    if (updateIndex === -1) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    const educationToUpdate = profile.education[updateIndex];

    if (schoolName) educationToUpdate.schoolName = schoolName;
    if (degree) educationToUpdate.degree = degree;
    if (fieldOfStudy) educationToUpdate.fieldOfStudy = fieldOfStudy;
    if (startDate) educationToUpdate.startDate = startDate;
    if (endDate) educationToUpdate.endDate = endDate;
    if (current !== undefined) educationToUpdate.current = current;
    if (skills) educationToUpdate.skills.push(...skills);
    if (isPublic !== undefined)
      educationToUpdate.isPublic = !educationToUpdate.isPublic;
    await profile.save();
    return res.status(200).json(profile.education);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const UpdateExperience = async (req, res) => {
  const {
    id,
    role,
    companyName,
    skills,
    startDate,
    current,
    description,
    endDate,
    isPublic,
  } = req.body;
  try {
    const profile = await PROFILE.findOne({ user: req.user }).select(
      'experience'
    );
    console.log(profile);
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found' });
    }
    const updateIndex = profile.experience.findIndex((exp) => exp.id === id);
    if (updateIndex === -1) {
      return res.status(404).json({ message: 'Experience entry not found' });
    }

    const experienceToUpdate = profile.experience[updateIndex];

    if (role) experienceToUpdate.role = role;
    if (companyName) experienceToUpdate.companyName = companyName;
    if (skills) experienceToUpdate.skills.push(...skills);
    if (startDate) experienceToUpdate.startDate = startDate;
    if (endDate) experienceToUpdate.endDate = endDate;
    if (current !== undefined) experienceToUpdate.current = current;
    if (description) experienceToUpdate.description = description;
    if (isPublic !== undefined) experienceToUpdate.isPublic = !isPublic;
    await profile.save();
    return res.status(200).json(profile.experience);
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

const UpdateProject = async (req, res) => {
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
  AddProject,
  AddCertification,
  AddAchievement,
  AddLanguages,
  DeleteEducation,
  DeleteExperience,
  DeleteSkills,
  DeleteProjects,
  DeleteCertifications,
  DeleteAchievements,
  DeleteLanguage,
  UpdateEducation,
  UpdateExperience,
  UpdateSkills,
  UpdateProject,
  UpdateCertifications,
  UpdateAchievements,
};
