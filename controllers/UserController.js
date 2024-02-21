const User = require('../models/user.model');
const Profile = require('../models/profile.model');
/**
 * @route GET /users/moderator
 */
const getModProfile = async (req, res) => {
  try {
    const moderator = await User.findById(req.userId);
    if (!moderator) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const moderatorInfo = {
      ...moderator._doc,
    };
    delete moderatorInfo.password;
    moderatorInfo.createdAt = moderatorInfo.createdAt.toLocaleString();

    res.status(200).json({
      moderatorInfo,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -activationToken')
      .lean()
      .exec();
    res.status(200).json({ users });
  } catch (err) {
    console.log(err);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.id;
  try {
    const user = await User.findOneAndDelete({ _id: id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.log(err);
  }
};

const getUser = (req, res) => {
  const { id } = req.params;
  const user = User.findById(id)
    .select('-password -activationToken -hasSentActivationEmail -refreshToken')
    .lean()
    .exec();
  if (!user) return res.status(401).json({ error: 'User not found' });
  return res.json({ user });
};

// update profile image

async function searchUsers(req, res) {
  try {
    const { query } = req.query; // Assuming the search query comes as a query parameter

    // Split the query by space and remove empty strings
    const queryParts = query.split(' ').filter((part) => part);

    let searchConditions = [];

    if (queryParts.length > 1) {
      // Search for matches where either firstName matches the first part and lastName matches the second part, or vice versa
      searchConditions = [
        {
          firstName: new RegExp(queryParts[0], 'i'),
          lastName: new RegExp(queryParts[1], 'i'),
        },
        {
          firstName: new RegExp(queryParts[1], 'i'),
          lastName: new RegExp(queryParts[0], 'i'),
        },
      ];
    } else if (queryParts.length === 1) {
      // Search for matches where either firstName or lastName matches the single part
      searchConditions = [
        { firstName: new RegExp(queryParts[0], 'i') },
        { lastName: new RegExp(queryParts[0], 'i') },
      ];
    }

    const users = await User.find({
      $or: searchConditions,
    }).limit(10); // Limit the number of results (adjust as needed)

    res.json(users);
  } catch (error) {
    res.status(500).send('Server error');
  }
}

async function fetchPublicPostsByUser(req, res) {
  const userId = req?.userId; // Assuming the user's ID is stored in req.user

  try {
    const publicPosts = await Post.aggregate([
      // Match posts that are public and belong to the specified user
      { $match: { user: mongoose.Types.ObjectId(userId), isPrivate: false } },

      // Add other stages as needed, e.g., $sort, $limit, $project

      // Optionally, populate user details (similar to .populate() in find queries)
      {
        $lookup: {
          from: 'users', // The collection name in the database
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' }, // Convert userDetails to an object (if it's guaranteed to have only one match)

      // Optionally, project fields you want to include in the result
      {
        $project: {
          content: 1,
          fileUrl: 1,
          'userDetails.name': 1,
          'userDetails.avatar': 1,
        },
      },
    ]);

    if (publicPosts.length === 0) {
      return res.status(404).json({ message: 'No public posts found' });
    }

    return res.status(200).json({
      status: 'success',
      data: publicPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getUsers,
  deleteUser,
  getUser,
  searchUsers,
  fetchPublicPostsByUser,
};
