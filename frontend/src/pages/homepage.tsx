import { Box } from "@chakra-ui/react";
import React from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import EnsProofCard from "../components/ENS/EnsProofCard";
import ENSNameResolver from "../components/ENS/ENSNameResolver";
import Steps from "../components/Tutorial/Steps";

const HomePage = () => {
  return (
    <Box py={2}>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Storage Variable Verification</Tab>
          <Tab>ENS Name Resolution</Tab>
          <Tab>Steps/Introduction</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <EnsProofCard />
          </TabPanel>
          <TabPanel>
            <ENSNameResolver />
          </TabPanel>
          <TabPanel>
            <Steps />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default HomePage;
