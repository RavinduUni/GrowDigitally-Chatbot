export const saveKnowledgeBase = async (req, res) => {
  try {
    const { data } = req.body;

    console.log("Data received:", data);
    res.status(200).json({ success: true, data, message: "Knowledge Base saved successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to save Knowledge Base",
    });
  }
}
    