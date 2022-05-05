import { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";
import { prisma } from "../../../../../lib/prisma";
import { Post } from "@prisma/client";
import Header from "../../../../../components/Header";
import Footer from "../../../../../components/Footer";
import GlobalHead from "../../../../../components/Head";
import Article from "../../../../../components/Article";

const Home: NextPage<{ post: Post }> = ({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <div
      className="post-template-default single single-post postid-478097 single-format-standard"
      id="tcbody"
    >
      <GlobalHead />
      <Header />
      <Article />
      {post && (
        <div>
          <pre>{JSON.stringify(post, null, 2)}</pre>
          <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<{ post: Post | null }> = async (
  context
) => {
  const post = await prisma.post.findUnique({
    where: {
      slug: context.params?.slug as string,
    },
  });

  // if (!post) {
  //   throw new Error();
  // }
  return {
    props: { post: JSON.parse(JSON.stringify(post)) },
    notFound: post ? false : true,
  };
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}
