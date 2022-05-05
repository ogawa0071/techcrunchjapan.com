import { GetStaticProps, InferGetStaticPropsType } from "next";
import type { NextPage } from "next";
import { prisma } from "../../../lib/prisma";
import { Tag } from "@prisma/client";

const Home: NextPage<{ tag: Tag }> = ({
  tag,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <div>
      <div>{JSON.stringify(tag)}</div>
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps<{ tag: Tag }> = async (context) => {
  const tag = await prisma.tag.findUnique({
    where: {
      slug: context.params?.slug as string,
    },
  });

  if (!tag) {
    throw new Error();
  }
  return { props: { tag: tag } };
};
