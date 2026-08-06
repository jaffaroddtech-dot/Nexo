const getComments = async () => {
  const response = await fetch("https://dummyjson.com/comments");
  const data = await response.json();

  return data.comments;
};

export default getComments;