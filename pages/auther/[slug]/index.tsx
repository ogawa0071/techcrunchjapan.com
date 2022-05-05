import { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";
import { prisma } from "../../../lib/prisma";
import { User } from "@prisma/client";

const Home: NextPage<{ user: User }> = ({
  user,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <div>
      {user && (
        <div>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<{ user: User | null }> = async (
  context
) => {
  const user = await prisma.user.findUnique({
    where: {
      slug: context.params?.slug as string,
    },
    include: {
      posts: {
        take: 10,
      },
    },
  });

  // if (!user) {
  //   throw new Error();
  // }
  return {
    props: { user: JSON.parse(JSON.stringify(user)) },
    notFound: user ? false : true,
  };
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}
