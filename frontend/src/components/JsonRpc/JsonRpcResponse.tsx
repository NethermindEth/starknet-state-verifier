import React, { Key } from "react";
import { Box, Code, Flex, Icon } from "@chakra-ui/react";
import { EditablePreview, EditableTextarea, useColorModeValue, IconButton, Input, useDisclosure, useEditableControls, ButtonGroup, SlideFade, Editable, Tooltip, EditableInput } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import { json } from "starknet"

const EditableControls = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();
  return isEditing ? (
    <Flex justifyContent="center" mt="2">
      <ButtonGroup size='sm'>
        <IconButton aria-label='Save' icon={<CheckIcon />} {...getSubmitButtonProps()} />
        <IconButton aria-label='Cancel' icon={<CloseIcon />} {...getCancelButtonProps()} />
      </ButtonGroup>
    </Flex>
  ) : (
    <Flex justifyContent='center'>
      <IconButton size='sm' aria-label="edit" icon={<EditIcon />} {...getEditButtonProps()} />
    </Flex>
  )
};

interface Props {
  data: any;
  onResult: (result: any) => void;
}

const JsonRpcResponse = (props: Props) => {

  const onSubmitString = (newValue: string) => {
    try {
      let jsonObject = json.parse(newValue)
      props.onResult(jsonObject)
    }
    catch (e) {
      console.log(e)
    }
  }

  return (
    <Flex
      flexDir={"column"}
      alignItems={"center"}
      justifyContent={"center"}
      w={"100%"}
      padding={"16px"}
    >
      {props.data && <Editable maxHeight={"500px"} maxW={"800px"} overflowX={"scroll"} textAlign="left" whiteSpace={"pre"}
        display={"block"} backgroundColor="gray.100" _hover={{ backgroundColor: "gray.200" }} defaultValue={json.stringify(props.data, null, 2)} onSubmit={onSubmitString} >
        <EditablePreview />
        <EditableTextarea height="500px" width="800px" />
        <EditableControls />
      </Editable>}
    </Flex>
  );
};

export default JsonRpcResponse;
