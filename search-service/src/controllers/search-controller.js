const logger = require("../utils/logger");
const Search = require("../models/Search");

const searchPostCOntroller = async (req, res) => {
  logger.info("Search endpoint hit");
  try {
    const { query } = req.query;
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    res.json(results);
  } catch (error) {
    logger.error("Serach   post error occurred", error);

    return res.status(500).json({
      status: false,
      message: "Search  post error occurred",
    });
  }
};

module.exports = { searchPostCOntroller };
